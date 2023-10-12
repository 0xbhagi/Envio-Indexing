// Generated by ReScript, PLEASE EDIT WITH CARE
'use strict';

var IO = require("./IO.bs.js");
var Env = require("./Env.bs.js");
var Curry = require("rescript/lib/js/curry.js");
var Types = require("./Types.bs.js");
var Utils = require("./Utils.bs.js");
var Hrtime = require("./bindings/Hrtime.bs.js");
var Js_exn = require("rescript/lib/js/js_exn.js");
var Context = require("./Context.bs.js");
var Logging = require("./Logging.bs.js");
var Handlers = require("./Handlers.bs.js");
var Belt_Array = require("rescript/lib/js/belt_Array.js");
var Caml_array = require("rescript/lib/js/caml_array.js");
var EventUtils = require("./EventUtils.bs.js");
var Prometheus = require("./Prometheus.bs.js");
var Belt_Option = require("rescript/lib/js/belt_Option.js");
var DbFunctions = require("./DbFunctions.bs.js");
var ChainFetcher = require("./eventFetching/ChainFetcher.bs.js");
var ChainManager = require("./eventFetching/ChainManager.bs.js");
var Caml_js_exceptions = require("rescript/lib/js/caml_js_exceptions.js");

function addEventToRawEvents($$event, inMemoryStore, chainId, jsonSerializedParams, eventName) {
  var logIndex = $$event.logIndex;
  var blockNumber = $$event.blockNumber;
  var eventId = EventUtils.packEventIndex(blockNumber, logIndex);
  var rawEvent_event_id = eventId.toString();
  var rawEvent_transaction_index = $$event.transactionIndex;
  var rawEvent_transaction_hash = $$event.transactionHash;
  var rawEvent_src_address = $$event.srcAddress;
  var rawEvent_block_hash = $$event.blockHash;
  var rawEvent_block_timestamp = $$event.blockTimestamp;
  var rawEvent_event_type = Types.eventName_encode(eventName);
  var rawEvent_params = JSON.stringify(jsonSerializedParams);
  var rawEvent = {
    chain_id: chainId,
    event_id: rawEvent_event_id,
    block_number: blockNumber,
    log_index: logIndex,
    transaction_index: rawEvent_transaction_index,
    transaction_hash: rawEvent_transaction_hash,
    src_address: rawEvent_src_address,
    block_hash: rawEvent_block_hash,
    block_timestamp: rawEvent_block_timestamp,
    event_type: rawEvent_event_type,
    params: rawEvent_params
  };
  var eventIdStr = eventId.toString();
  Curry._5(IO.InMemoryStore.RawEvents.set, inMemoryStore.rawEvents, {
        chainId: chainId,
        eventId: eventIdStr
      }, {
        event_chain_id: chainId,
        event_id: eventIdStr
      }, /* Set */1, rawEvent);
}

function eventRouter(item, inMemoryStore) {
  var $$event = item.event;
  var $$event$1 = $$event._0;
  var jsonSerializedParams = Curry._1(Types.MyAwesomeContractContract.AwesomeEventEvent.eventArgs_encode, $$event$1.params);
  addEventToRawEvents($$event$1, inMemoryStore, item.chainId, jsonSerializedParams, /* MyAwesomeContractContract_AwesomeEventEvent */0);
  var handler = Curry._1(Handlers.MyAwesomeContractContract.AwesomeEvent.getHandler, undefined);
  var context = Curry._1($$event._1, undefined);
  try {
    return Curry._2(handler, $$event$1, context);
  }
  catch (raw_userCodeException){
    var userCodeException = Caml_js_exceptions.internalToOCamlException(raw_userCodeException);
    var eventInfoString = "The details of the event that caused this issue:\n              eventName: MyAwesomeContract.AwesomeEvent\n              txHash: " + $$event$1.transactionHash + "\nblockNumber: " + String($$event$1.blockNumber) + "\nlogIndex: " + String($$event$1.logIndex) + "\ntransactionIndex: " + String($$event$1.transactionIndex) + "";
    var tmp;
    if (userCodeException.RE_EXN_ID === Js_exn.$$Error) {
      var m = userCodeException._1.message;
      tmp = m !== undefined ? "Caught a JS exception in your MyAwesomeContractContract.AwesomeEvent.handler with this message: " + m + ".\n\nPlease fix this error to keep the indexer running smoothly.\n\n" + eventInfoString + "\n" : undefined;
    } else {
      tmp = undefined;
    }
    var errorMessage = Belt_Option.getWithDefault(tmp, "Unknown error in your MyAwesomeContractContract.AwesomeEvent.handler, please review your code carefully and use the stack trace to help you find the issue.\n\n" + eventInfoString + "");
    return Curry._2(context.log.errorWithExn, Caml_js_exceptions.as_js_exn(userCodeException), errorMessage);
  }
}

async function loadReadEntitiesInner(inMemoryStore, eventBatch, logger, chainManager) {
  var loadNestedReadEntities = async function (logIndex, dynamicContracts, fromBlock, currentBatchLastEventIndex, chainId) {
    var chainFetcher = ChainManager.getChainFetcher(chainManager, chainId);
    var eventBatchPromises = await ChainFetcher.addDynamicContractAndFetchMissingEvents(chainFetcher, dynamicContracts, fromBlock, logIndex + 1 | 0);
    var eventsForCurrentBatch = [];
    for(var i = 0 ,i_finish = eventBatchPromises.length; i < i_finish; ++i){
      var item = Caml_array.get(eventBatchPromises, i);
      var eventIndex_timestamp = item.timestamp;
      var eventIndex_chainId = item.chainId;
      var eventIndex_blockNumber = item.blockNumber;
      var eventIndex_logIndex = item.logIndex;
      var eventIndex = {
        timestamp: eventIndex_timestamp,
        chainId: eventIndex_chainId,
        blockNumber: eventIndex_blockNumber,
        logIndex: eventIndex_logIndex
      };
      if (EventUtils.isEarlierEvent(eventIndex, currentBatchLastEventIndex)) {
        eventsForCurrentBatch.push(item);
      } else {
        ChainManager.addItemToArbitraryEvents(chainManager, item);
      }
    }
    if (eventsForCurrentBatch.length !== 0) {
      return await loadReadEntitiesInner(inMemoryStore, eventsForCurrentBatch, logger, chainManager);
    } else {
      return [];
    }
  };
  var baseResults = [];
  var optLastItemInBatch = Belt_Array.get(eventBatch, eventBatch.length - 1 | 0);
  if (optLastItemInBatch === undefined) {
    return [];
  }
  var currentBatchLastEventIndex_timestamp = optLastItemInBatch.timestamp;
  var currentBatchLastEventIndex_chainId = optLastItemInBatch.chainId;
  var currentBatchLastEventIndex_blockNumber = optLastItemInBatch.blockNumber;
  var currentBatchLastEventIndex_logIndex = optLastItemInBatch.logIndex;
  var currentBatchLastEventIndex = {
    timestamp: currentBatchLastEventIndex_timestamp,
    chainId: currentBatchLastEventIndex_chainId,
    blockNumber: currentBatchLastEventIndex_blockNumber,
    logIndex: currentBatchLastEventIndex_logIndex
  };
  for(var i = 0 ,i_finish = eventBatch.length; i < i_finish; ++i){
    var match = Caml_array.get(eventBatch, i);
    var chainId = match.chainId;
    var $$event = match.event._0;
    var contextHelper = Curry._4(Context.MyAwesomeContractContract.AwesomeEventEvent.contextCreator, inMemoryStore, chainId, $$event, logger);
    var context = Curry._1(contextHelper.getLoaderContext, undefined);
    var loader = Curry._1(Handlers.MyAwesomeContractContract.AwesomeEvent.getLoader, undefined);
    try {
      Curry._2(loader, $$event, context);
    }
    catch (raw_userCodeException){
      var userCodeException = Caml_js_exceptions.internalToOCamlException(raw_userCodeException);
      var eventInfoString = "The details of the event that caused this issue:\n  eventName: MyAwesomeContract.AwesomeEvent\n  txHash: " + $$event.transactionHash + "\n  blockNumber: " + String($$event.blockNumber) + "\n  logIndex: " + String($$event.logIndex) + "\n  transactionIndex: " + String($$event.transactionIndex) + "";
      var tmp;
      if (userCodeException.RE_EXN_ID === Js_exn.$$Error) {
        var m = userCodeException._1.message;
        tmp = m !== undefined ? "Caught a JS exception in your MyAwesomeContractContract.AwesomeEvent.loader with this message: " + m + ".\n\n  Please fix this error to keep the indexer running smoothly.\n\n  " + eventInfoString + "\n  " : undefined;
      } else {
        tmp = undefined;
      }
      var errorMessage = Belt_Option.getWithDefault(tmp, "Unknown error in your MyAwesomeContractContract.AwesomeEvent.loader, please review your code carefully and use the stack trace to help you find the issue.\n\n  " + eventInfoString + "");
      Logging.childErrorWithExn(logger, userCodeException, errorMessage);
    }
    var logIndex = $$event.logIndex;
    var blockNumber = $$event.blockNumber;
    var eventId = EventUtils.packEventIndex(blockNumber, logIndex);
    var context$1 = Curry._1(contextHelper.getContext, {
          event_chain_id: chainId,
          event_id: eventId.toString()
        });
    var dynamicContracts = Curry._1(contextHelper.getAddedDynamicContractRegistrations, undefined);
    baseResults.push({
          timestamp: match.timestamp,
          chainId: chainId,
          blockNumber: match.blockNumber,
          logIndex: match.logIndex,
          data: [
            Curry._1(contextHelper.getEntitiesToLoad, undefined),
            /* MyAwesomeContractContract_AwesomeEventWithContext */{
              _0: $$event,
              _1: context$1
            },
            dynamicContracts.length !== 0 ? await loadNestedReadEntities(logIndex, dynamicContracts, blockNumber, currentBatchLastEventIndex, chainId) : undefined
          ]
        });
  }
  return baseResults;
}

function unwrap(p) {
  var match = p.data;
  return {
          timestamp: p.timestamp,
          chainId: p.chainId,
          blockNumber: p.blockNumber,
          logIndex: p.logIndex,
          entityReads: match[0],
          eventAndContext: match[1]
        };
}

async function recurseEntityPromises(p) {
  var match = p.data;
  var nested = match[2];
  return {
          result: unwrap(p),
          nested: nested !== undefined ? await Promise.all(Belt_Array.map(nested, recurseEntityPromises)) : undefined
        };
}

function resultPosition(param) {
  return EventUtils.getEventComparator({
              timestamp: param.timestamp,
              chainId: param.chainId,
              blockNumber: param.blockNumber,
              logIndex: param.logIndex
            });
}

function flattenNested(xs) {
  var baseResults = Belt_Array.map(xs, (function (param) {
          return param.result;
        }));
  var nestedNestedResults = Belt_Array.keepMap(xs, (function (param) {
          return param.nested;
        }));
  var nestedResults = Belt_Array.map(nestedNestedResults, flattenNested);
  return Belt_Array.reduce(nestedResults, baseResults, (function (acc, additionalResults) {
                return Utils.mergeSorted(resultPosition, acc, additionalResults);
              }));
}

async function loadReadEntities(inMemoryStore, eventBatch, chainManager, logger) {
  var batch = await loadReadEntitiesInner(inMemoryStore, eventBatch, logger, chainManager);
  var nestedResults = await Promise.all(Belt_Array.map(batch, recurseEntityPromises));
  var mergedResults = flattenNested(nestedResults);
  var resultToPair = function (param) {
    return [
            param.entityReads,
            {
              chainId: param.chainId,
              event: param.eventAndContext
            }
          ];
  };
  var match = Belt_Array.unzip(Belt_Array.map(mergedResults, resultToPair));
  var readEntities = Belt_Array.concatMany(match[0]);
  await IO.loadEntities(DbFunctions.sql, inMemoryStore, readEntities);
  return match[1];
}

function registerProcessEventBatchMetrics(logger, batchSize, loadDuration, handlerDuration, dbWriteDuration) {
  Logging.childTrace(logger, {
        message: "Finished processing batch",
        batch_size: batchSize,
        loader_time_elapsed: loadDuration,
        handlers_time_elapsed: handlerDuration,
        write_time_elapsed: dbWriteDuration
      });
  Prometheus.incrementLoadEntityDurationCounter(loadDuration);
  Prometheus.incrementEventRouterDurationCounter(handlerDuration);
  Prometheus.incrementExecuteBatchDurationCounter(dbWriteDuration);
  Prometheus.incrementEventsProcessedCounter(batchSize);
}

async function processEventBatch(eventBatch, chainManager, inMemoryStore) {
  var logger = Logging.createChild({
        context: "batch",
        from_block_index: Belt_Option.map(Belt_Array.get(eventBatch, 0), (function (param) {
                return "" + String(param.blockNumber) + "-" + String(param.logIndex) + "";
              }))
      });
  var timeRef = Hrtime.makeTimer(undefined);
  var eventBatchAndContext = await loadReadEntities(inMemoryStore, eventBatch, chainManager, logger);
  var elapsedAfterLoad = Hrtime.intFromMillis(Hrtime.toMillis(Hrtime.timeSince(timeRef)));
  Belt_Array.forEach(eventBatchAndContext, (function ($$event) {
          eventRouter($$event, inMemoryStore);
        }));
  var elapsedTimeAfterProcess = Hrtime.intFromMillis(Hrtime.toMillis(Hrtime.timeSince(timeRef)));
  await IO.executeBatch(DbFunctions.sql, inMemoryStore);
  var elapsedTimeAfterDbWrite = Hrtime.intFromMillis(Hrtime.toMillis(Hrtime.timeSince(timeRef)));
  return registerProcessEventBatchMetrics(logger, eventBatch.length, elapsedAfterLoad, elapsedTimeAfterProcess - elapsedAfterLoad | 0, elapsedTimeAfterDbWrite - elapsedTimeAfterProcess | 0);
}

async function startProcessingEventsOnQueue(chainManager) {
  while(true) {
    var nextBatch = await ChainManager.createBatch(chainManager, 1, Env.maxProcessBatchSize);
    var inMemoryStore = IO.InMemoryStore.make(undefined);
    await processEventBatch(nextBatch, chainManager, inMemoryStore);
  };
}

exports.addEventToRawEvents = addEventToRawEvents;
exports.eventRouter = eventRouter;
exports.loadReadEntitiesInner = loadReadEntitiesInner;
exports.unwrap = unwrap;
exports.recurseEntityPromises = recurseEntityPromises;
exports.resultPosition = resultPosition;
exports.flattenNested = flattenNested;
exports.loadReadEntities = loadReadEntities;
exports.registerProcessEventBatchMetrics = registerProcessEventBatchMetrics;
exports.processEventBatch = processEventBatch;
exports.startProcessingEventsOnQueue = startProcessingEventsOnQueue;
/* IO Not a pure module */
