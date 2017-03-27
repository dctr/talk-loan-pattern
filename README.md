<!-- $theme: gaia -->
<!-- $size: 16:9 -->

# Talk - Loan Pattern

A talk about the loan pattern.

---

# Loaning - The elegant way to manage resources

---

# TODO

## Outline

Resource management issues

- Repetetive cleanup code
- Error prone
- No separation of concerns
- FP: 

## Pros

- Separation of Concerns
- Unit testing with dependency injection
- Maybe event apply additional logic (wrap query) or restric (only pass down some functions, but not all)

Vocabulary

- main
- Loaner
- Loanee

---

# Motivation

```js
const doEverything = resourceConfig => {
  try {
    const resource = aquire(resourceConfig);

    const someData = resource.query('SOME QUERY');
    const processedData = process(someData);
    return processedData;
  } finally {
    resource && dispose(resource);
  }
}

const result = doEverything(resourceConfig);
```

---

# What we want to do

*Query something*

- We know how our query has to look like
- We don't care about anything else (... or at least we don't want to)

---

# What we need to do

- Acquire a resource
- Query the resource
- Dispose of the resource
- Handle disposal even in exception case!

---

# Motivation 2

Be a good coder

- Adhere to DRY principle
  - Resource management everywhere a resource is needed
- Adhere to Singe Responsibility Principle 
  - Mix resource management and application logic
- Go FP style
  - Higher order functions
  - Encapsuling what can cause side-effects
- Go async

---

# Step 1

- Separation of concerns
- Using a higher order function for the loanee

---

# Step 1

```js
// Loaner
const using = (resourceConfig, withResource) => {
  try {
    const resource = aquire(resourceConfig);

    // Call Loanee
    return withResource(resource);

  } finally {
    resource && dispose(resource);
  }
};
```

---

# Step 1

```js
// Loanee
const loanee = resource => {
  const someData = resource.query('SOME QUERY');
  const processedData = process(someData);
  return processedData;
};

// Execution
const result = using(resourceConfig, loanee);
```

---

# Step 2

- Promises
- Using a higher order function for the loaner as well

---

# Step 2

```js
// Loaner
const using = resourceConfig => withResource => {
  let resource;
  return new Promise((resolve, reject) => {
    resource = aquire(resourceConfig);
    return withResource(resource, resolve, reject);
  })
  .then(result => {
    dispose(resource);
    return result;
  }).catch(error => {
    resource && dispose(resource);
    throw error;
  });
};
```

---

# Step 2

```js
// Execution
using(resourceConfig)((resource, resolve, reject) => resource
  .query('SOME QUERY')
  .then(someData => process(someData))
  .then(resolve);
)
.then(result => /* ... */);
```

---

# Bonus Level

Parameterizing the loanee

```js
const parameterizeLoanee = params => resource => {
  const configuredQuery = configureQuery(params);
  const someData = resource.query(configuredQuery);
  const processedData = process(someData);
  return processedData;
};

const withResource = parameterizeLoanee(params);
using(resourceConfig)(withResource)
  .then(result => /* ... */);
```

---

# Application

```js
const usingDbConnection = dbConfig => metricsFetcher => new Promise((resolve, reject) => {
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
```

---

# Application

```js
const createMetricsFetcher = desiredMetrics => (query, resolve, reject) =>
  new Promise((resolve, reject) => {
    const fields = desiredMetrics.join(', ');
    return query(`SELECT ${fields} FROM metrics;`)
      .then(processResults);
  });
```

---

# Application

```js
const dbConfig = {
  host: 'some-host',
  database: 'some-db',
  username: 'user',
  password: 'secret'
};
const desiredMetrics = ['metricA', 'metricB', 'metricC'];

usingDbConnection(dbConfig)(createMetricsFetcher(desiredMetrics))
  .then(result => /* ... */);
```