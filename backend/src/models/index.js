/**
 * RTTPS - Unified Model Adapter
 * Seamlessly exposes Mongoose models or memory-backed models depending on DB connection status.
 */

const { isMongoActive, getFallbackStore, saveFallbackStore } = require('../config/db');
const { MongooseModels } = require('./schemas');

const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

// Query filter matcher for in-memory operations
const matchesQuery = (item, query) => {
  if (!query || Object.keys(query).length === 0) return true;
  for (const key of Object.keys(query)) {
    const qVal = query[key];
    if (key === '$or' && Array.isArray(qVal)) {
      const orMatched = qVal.some(subQ => matchesQuery(item, subQ));
      if (!orMatched) return false;
      continue;
    }

    const itemVal = item[key] !== undefined ? item[key] : (key === '_id' ? item.id : undefined);

    if (qVal instanceof RegExp) {
      if (!qVal.test(String(itemVal || ''))) return false;
    } else if (typeof qVal === 'object' && qVal !== null && !Array.isArray(qVal)) {
      if (qVal.$regex) {
        const regex = new RegExp(qVal.$regex, qVal.$options || '');
        if (!regex.test(String(itemVal || ''))) return false;
      } else if (qVal.$in && Array.isArray(qVal.$in)) {
        if (!qVal.$in.includes(itemVal)) return false;
      } else if (qVal.$ne !== undefined) {
        if (itemVal === qVal.$ne) return false;
      } else if (qVal.$gt !== undefined) {
        if (!(itemVal > qVal.$gt)) return false;
      } else if (qVal.$gte !== undefined) {
        if (!(itemVal >= qVal.$gte)) return false;
      } else if (qVal.$lt !== undefined) {
        if (!(itemVal < qVal.$lt)) return false;
      } else if (qVal.$lte !== undefined) {
        if (!(itemVal <= qVal.$lte)) return false;
      }
    } else {
      if (itemVal != qVal) return false;
    }
  }
  return true;
};

// Builder for chained query results
class QueryBuilder {
  constructor(dataPromise) {
    this.dataPromise = dataPromise;
  }

  async exec() {
    return await this.dataPromise;
  }

  then(resolve, reject) {
    return this.dataPromise.then(resolve, reject);
  }

  catch(reject) {
    return this.dataPromise.catch(reject);
  }

  sort(sortObj) {
    this.dataPromise = this.dataPromise.then(items => {
      if (!Array.isArray(items) || !sortObj) return items;
      const key = Object.keys(sortObj)[0];
      const order = sortObj[key] >= 0 ? 1 : -1;
      return [...items].sort((a, b) => {
        if (a[key] > b[key]) return 1 * order;
        if (a[key] < b[key]) return -1 * order;
        return 0;
      });
    });
    return this;
  }

  limit(num) {
    this.dataPromise = this.dataPromise.then(items => {
      if (!Array.isArray(items)) return items;
      return items.slice(0, num);
    });
    return this;
  }

  select(fields) {
    // Return self for chaining compatibility
    return this;
  }
}

const createFallbackModel = (collectionName) => {
  return {
    find: (query = {}) => {
      const store = getFallbackStore();
      const list = store[collectionName] || [];
      const filtered = list.filter(item => matchesQuery(item, query));
      return new QueryBuilder(Promise.resolve(JSON.parse(JSON.stringify(filtered))));
    },

    findOne: (query = {}) => {
      const store = getFallbackStore();
      const list = store[collectionName] || [];
      const item = list.find(item => matchesQuery(item, query));
      return new QueryBuilder(Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null));
    },

    findById: (id) => {
      const store = getFallbackStore();
      const list = store[collectionName] || [];
      const item = list.find(it => it._id === id || it.id === id);
      return new QueryBuilder(Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null));
    },

    create: async (data) => {
      const store = getFallbackStore();
      if (!store[collectionName]) store[collectionName] = [];
      const newDoc = {
        _id: generateId(),
        ...data,
        createdAt: data.createdAt || new Date().toISOString()
      };
      store[collectionName].push(newDoc);
      saveFallbackStore();
      return JSON.parse(JSON.stringify(newDoc));
    },

    insertMany: async (items) => {
      const store = getFallbackStore();
      if (!store[collectionName]) store[collectionName] = [];
      const docs = items.map(d => ({
        _id: d._id || generateId(),
        ...d,
        createdAt: d.createdAt || new Date().toISOString()
      }));
      store[collectionName].push(...docs);
      saveFallbackStore();
      return JSON.parse(JSON.stringify(docs));
    },

    findByIdAndUpdate: async (id, update, options = {}) => {
      const store = getFallbackStore();
      const list = store[collectionName] || [];
      const index = list.findIndex(it => it._id === id || it.id === id);
      if (index === -1) return null;
      
      const payload = update.$set ? { ...update.$set } : { ...update };
      list[index] = { ...list[index], ...payload, updatedAt: new Date().toISOString() };
      saveFallbackStore();
      return JSON.parse(JSON.stringify(list[index]));
    },

    findOneAndUpdate: async (query, update, options = {}) => {
      const store = getFallbackStore();
      const list = store[collectionName] || [];
      const index = list.findIndex(it => matchesQuery(it, query));
      if (index === -1) {
        if (options.upsert) {
          const newDoc = {
            _id: generateId(),
            ...query,
            ...(update.$set || update),
            createdAt: new Date().toISOString()
          };
          list.push(newDoc);
          saveFallbackStore();
          return JSON.parse(JSON.stringify(newDoc));
        }
        return null;
      }
      const payload = update.$set ? { ...update.$set } : { ...update };
      list[index] = { ...list[index], ...payload, updatedAt: new Date().toISOString() };
      saveFallbackStore();
      return JSON.parse(JSON.stringify(list[index]));
    },

    findByIdAndDelete: async (id) => {
      const store = getFallbackStore();
      const list = store[collectionName] || [];
      const index = list.findIndex(it => it._id === id || it.id === id);
      if (index === -1) return null;
      const [removed] = list.splice(index, 1);
      saveFallbackStore();
      return JSON.parse(JSON.stringify(removed));
    },

    deleteMany: async (query = {}) => {
      const store = getFallbackStore();
      if (Object.keys(query).length === 0) {
        const count = (store[collectionName] || []).length;
        store[collectionName] = [];
        saveFallbackStore();
        return { deletedCount: count };
      }
      const initial = store[collectionName] || [];
      const remaining = initial.filter(item => !matchesQuery(item, query));
      const deletedCount = initial.length - remaining.length;
      store[collectionName] = remaining;
      saveFallbackStore();
      return { deletedCount };
    },

    countDocuments: async (query = {}) => {
      const store = getFallbackStore();
      const list = store[collectionName] || [];
      return list.filter(item => matchesQuery(item, query)).length;
    }
  };
};

const FallbackModels = {
  User: createFallbackModel('users'),
  Station: createFallbackModel('stations'),
  Train: createFallbackModel('trains'),
  Schedule: createFallbackModel('schedules'),
  LiveTracking: createFallbackModel('livetracking'),
  Prediction: createFallbackModel('predictions'),
  Notification: createFallbackModel('notifications'),
  HistoricalRecord: createFallbackModel('historicalrecords'),
};

// Model proxy handler that delegates based on active MongoDB connection
const createModelProxy = (modelName) => {
  return new Proxy({}, {
    get: (target, prop) => {
      const activeModel = isMongoActive() ? MongooseModels[modelName] : FallbackModels[modelName];
      if (typeof activeModel[prop] === 'function') {
        return activeModel[prop].bind(activeModel);
      }
      return activeModel[prop];
    }
  });
};

module.exports = {
  User: createModelProxy('User'),
  Station: createModelProxy('Station'),
  Train: createModelProxy('Train'),
  Schedule: createModelProxy('Schedule'),
  LiveTracking: createModelProxy('LiveTracking'),
  Prediction: createModelProxy('Prediction'),
  Notification: createModelProxy('Notification'),
  HistoricalRecord: createModelProxy('HistoricalRecord'),
  MongooseModels,
  FallbackModels
};
