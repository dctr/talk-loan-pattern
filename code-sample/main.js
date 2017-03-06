// Motivation

const doEverything = resourceConfig => {
  // Repetetive resource handling code
  try {
    const resource = aquire(resourceConfig);

    // This is where the logic starts
    const someData = resource.query('SOME QUERY');
    const processedData = process(someData);
    return processedData;
    // This is where the logic ends

  } finally {
    resource && dispose(resource);
  }
}

const result = doEverything(resourceConfig);


// Scenario 1 -- Exception-based

// Loaner
const using = (resourceConfig, withResource) => {
  try {
    const resource = aquire(resourceConfig);

    // Call Loanee
    return withResource(resource);

  } finally {
    resource && dispose(resource);
  }
}

// Execution with a loanee
const result = using(resourceConfig, resource => {
  const someData = resource.query('SOME QUERY');
  const processedData = process(someData);
  return processedData;
});


// Scenario 2 -- Promise-based & separate execution

// Loaner
const using(resourceConfig, withResource) => {
  let resource;
  return new Promise((resolve, reject) => {
    resource = aquire(resourceConfig);
    return withResource(resource, resolve, reject);
  }).catch(error => {
    resource && dispose(resource);
    throw error;
  });
}

// Loanee
const withResource = (resource, resolve, reject) => {
  return resource.query('SOME QUERY')
    .then(someData => process(someData))
    .then(resolve);
}

// Execution
const result = using(resourceConfig, withResource);


// Scenario 3 -- Parameterized loanee

const parameterizeLoanee = params => resource => {
  // Logic
};

// Execution
const withResource = parameterizeLoanee(params);
const result = using(resourceConfig, withResource);


// Application DB

const usingDbConnection = (dbConfig, metricsFetcher) => {
  return new Promise((resolve, reject) => {
    let connection;
    db.connect(dbConfig)
      .then(c => {
        connection = c;
        return metricsFetcher(connection.query, resolve, reject);
      })
      .then((connection, result) => {
        connection.close();
        return result;
      })
      .catch(e => {
        connection && connection.close();
        throw e;
      });
  });
};

const createMetricsFetcher = desiredMetrics => (query, resolve, reject) => {
  return new Promise((resolve, reject) => {
    const fields = desiredMetrics.join(', ');
    return query(`SELECT ${fields} FROM metrics;`)
      .then(processResults);
  });
};

const dbConfig = {
  host: 'some-host',
  database: 'some-db',
  username: 'user',
  password: 'secret'
};
const desiredMetrics = ['metricA', 'metricB', 'metricC'];

return usingDbConnection(dbConfig, createMetricsFetcher(desiredMetrics));
