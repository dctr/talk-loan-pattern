<!-- $size: 16:9 -->

# Loaning

## The elegant way to managing resources

---

# (De-)Motivation

Code all too often looks like this:

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

# What we need to do

- Acquire a **resource**
- Execute a query
- Dispose of the **resource**
- Handle disposal of the **resource** even in exception case!
- Again, and again, and again...

---

# What we want to do

- Acquire a resource
- Execute a query <= This is what we actually **want** to do
- Dispose of the resource
- Handle disposal of the resource even in exception case!
- Once <= And *maybe* this

---

# Motivation

- Adhere to DRY principle
  - Reusable resource management module
- Adhere to Singe Responsibility Principle
  - Separate query logic and resource logic
- Adhere to Dependency Inversion Principle
  - Nicely testable

---

# Motivation (cont'd)

- Go FP style
  - Higher-order functions
  - Encapsuling side-effects
- Go async
  - Because resources usually are

---

# Idea

- Loan resource to a loanee
- Let loanee tell when query is complete
- Let caller trigger creation and passing of functions

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
- Using an even higher order function for the loaner

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
using(resourceConfig)((resource, resolve, reject) =>
  resource
    .query('SOME QUERY')
    .then(someData => process(someData))
    .then(resolve)
)
.then(result => /* ... */);
```

---

# Bonus Level

Parameterizing the loanee

```js
const parameterizeLoanee = params => (resource, resolve, reject) => 
  resource
    .query('SOME QUERY')
    .then(someData => process(someData))
    .then(resolve);

const withResource = parameterizeLoanee(params);

using(resourceConfig)(withResource)
  .then(result => /* ... */);
```

---

# Application

```js
const usingDbConnection = dbConfig => dbLoaner => 
  new Promise((resolve, reject) => {
    let connection;
    db.connect(dbConfig)
      .then(c => {
        connection = c;
        return dbLoaner(connection.query, resolve, reject);
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