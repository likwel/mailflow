
// ── Dépendance à installer ──────────────────────────
// npm install node-cron luxon

const cron   = require('node-cron');
const { DateTime } = require('luxon');

/* ════════════════════════════════════════════════════
   SCHEDULER — appelé au démarrage du serveur (app.js)
   Lance les workflows de type "schedule" actifs
════════════════════════════════════════════════════ */
async function startScheduledWorkflows(prisma, runWorkflow) {
  // Charger tous les workflows actifs avec un trigger "schedule"
  const workflows = await prisma.workflow.findMany({
    where: { status: 'active' },
  });

  for (const workflow of workflows) {
    const triggerNode = workflow.nodes?.find(n => n.type === 'schedule');
    if (!triggerNode?.config) continue;
    registerSchedule(workflow, triggerNode.config, prisma, runWorkflow);
  }

  console.log(`[scheduler] ✅ ${workflows.length} workflow(s) chargés`);
}

/* ════════════════════════════════════════════════════
   Enregistrer un cron pour un workflow
════════════════════════════════════════════════════ */
const activeJobs = new Map(); // workflowId → tâche cron

function registerSchedule(workflow, config, prisma, runWorkflow) {
  const { freq, time, tz, days, dayOfMonth } = config;
  if (!freq || !time) return;

  const expression = buildCronExpression(freq, time, days, dayOfMonth);
  if (!expression) return;

  // Annuler un éventuel job existant pour ce workflow
  if (activeJobs.has(workflow.id)) {
    activeJobs.get(workflow.id).stop();
    activeJobs.delete(workflow.id);
  }

  const job = cron.schedule(expression, async () => {
    // Vérifier l'heure exacte dans le bon timezone
    const now = DateTime.now().setZone(tz || 'UTC');
    console.log(`[scheduler] Déclenchement workflow "${workflow.name}" — ${now.toISO()}`);

    try {
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId:   workflow.id,
          status:       'running',
          nodeStatuses: {},
          // context: {
          //   event:       'schedule',
          //   triggeredAt: now.toISO(),
          //   timezone:    tz,
          // },
        },
      });

      await runWorkflow(workflow, execution.id, {
        triggeredAt: now.toISO(),
        timezone:    tz,
      });
    } catch (err) {
      console.error(`[scheduler] Erreur workflow "${workflow.name}":`, err.message);
    }
  }, {
    timezone: tz || 'UTC', // node-cron gère nativement les timezones
  });

  activeJobs.set(workflow.id, job);
  console.log(`[scheduler] ✅ "${workflow.name}" — cron: "${expression}" (${tz})`);
}

/* ════════════════════════════════════════════════════
   Construire l'expression cron depuis la config
   Config: { freq, time, tz, days, dayOfMonth }

   Exemples :
   { freq: 'daily',   time: '19:26' }              → "26 19 * * *"
   { freq: 'weekly',  time: '09:00', days: [1,5] } → "0 9 * * 1,5"
   { freq: 'monthly', time: '08:00', dayOfMonth: 1}→ "0 8 1 * *"
   { freq: 'once',    time: '14:30' }              → exécution unique
════════════════════════════════════════════════════ */
function buildCronExpression(freq, time, days, dayOfMonth) {
  const [hStr, mStr] = (time || '09:00').split(':');
  const h = parseInt(hStr) || 0;
  const m = parseInt(mStr) || 0;

  switch (freq) {
    case 'daily':
      // Tous les jours à l'heure configurée
      return `${m} ${h} * * *`;

    case 'weekly': {
      // Jours sélectionnés (1=Lundi … 7=Dimanche en luxon, 0/7=Dim en cron)
      const cronDays = (days?.length ? days : [1])
        .map(d => d === 7 ? 0 : d) // convertir 7→0 pour cron
        .join(',');
      return `${m} ${h} * * ${cronDays}`;
    }

    case 'monthly': {
      // Un jour précis du mois
      const dom = dayOfMonth || 1;
      return `${m} ${h} ${dom} * *`;
    }

    case 'hourly':
      // Toutes les heures à la minute configurée
      return `${m} * * * *`;

    case 'once':
      // Pas de cron récurrent — géré séparément via setTimeout
      return null;

    default:
      return null;
  }
}

/* ════════════════════════════════════════════════════
   Exécution unique (freq: 'once')
   Calcule le délai jusqu'à la prochaine occurrence
════════════════════════════════════════════════════ */
async function scheduleOnce(workflow, config, prisma, runWorkflow) {
  const { time, tz, untilDate } = config;
  const zone = tz || 'UTC';

  // Construire la DateTime cible dans le bon timezone
  let target;
  if (untilDate) {
    const [hStr, mStr] = (time || '09:00').split(':');
    target = DateTime.fromISO(untilDate, { zone })
      .set({ hour: parseInt(hStr), minute: parseInt(mStr), second: 0 });
  } else {
    // Aujourd'hui à l'heure configurée
    const [hStr, mStr] = (time || '09:00').split(':');
    target = DateTime.now().setZone(zone)
      .set({ hour: parseInt(hStr), minute: parseInt(mStr), second: 0 });
  }

  const msUntil = target.toMillis() - Date.now();
  if (msUntil <= 0) {
    console.warn(`[scheduler] Heure passée pour "${workflow.name}", ignoré`);
    return;
  }

  console.log(`[scheduler] Exécution unique "${workflow.name}" dans ${Math.round(msUntil/1000)}s`);

  setTimeout(async () => {
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId:   workflow.id,
        status:       'running',
        nodeStatuses: {},
        context: { event: 'schedule.once', triggeredAt: target.toISO(), timezone: zone },
      },
    });
    await runWorkflow(workflow, execution.id, { triggeredAt: target.toISO() });
  }, msUntil);
}

/* ════════════════════════════════════════════════════
   API : recharger le scheduler quand un workflow
   est activé / modifié / désactivé
════════════════════════════════════════════════════ */
function refreshSchedule(workflow, prisma, runWorkflow) {
  const triggerNode = workflow.nodes?.find(n => n.type === 'schedule');

  if (workflow.status !== 'active' || !triggerNode) {
    // Arrêter le job s'il existe
    if (activeJobs.has(workflow.id)) {
      activeJobs.get(workflow.id).stop();
      activeJobs.delete(workflow.id);
      console.log(`[scheduler] ⏹ Arrêt job "${workflow.name}"`);
    }
    return;
  }

  const { config } = triggerNode;
  if (config.freq === 'once') {
    scheduleOnce(workflow, config, prisma, runWorkflow);
  } else {
    registerSchedule(workflow, config, prisma, runWorkflow);
  }
}

module.exports = { startScheduledWorkflows, refreshSchedule };
