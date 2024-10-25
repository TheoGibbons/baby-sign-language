async function processInBatches(tasks, batchSize) {
  let results = [];

  for (let i = 0; i < tasks.length; i += batchSize) {
    // Slice out a batch of tasks
    const batch = tasks.slice(i, i + batchSize);

    // Execute the batch of tasks
    const batchResults = await Promise.all(batch);

    // Collect the results
    results = results.concat(batchResults);
  }

  return results;
}