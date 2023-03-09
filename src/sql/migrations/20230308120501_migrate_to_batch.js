/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.table('experiment')
    .whereNull('pod_cpus')
    .orWhereNull('pod_memory')
    .update({
      pod_cpus: 2,
      pod_memory: 28000,
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.table('experiment')
    .where({
      pod_cpus: 2,
      pod_memory: 28000,
    })
    .update({
      pod_cpus: null,
      pod_memory: null,
    });
};
