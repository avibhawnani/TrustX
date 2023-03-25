'use strict';

/**
 * test-collection router
 */

module.exports = {
    routes: [
      {
        method: 'POST',
        path: '/exampleAction',
        handler: 'test-collection.exampleAction',
      },
      {
        method: 'POST',
        path: '/getBalance',
        handler: 'test-collection.getBalance',
      },
      {
        method: 'POST',
        path: '/addEntity',
        handler: 'test-collection.addEntity',
      },
      {
        method: 'POST',
        path: '/publisher_home',
        handler: 'test-collection.publisher_home',
      }
    ],
  };
