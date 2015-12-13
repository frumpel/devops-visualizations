/*

request-queue.js

A function to represent an HTML request queue. This is heavily optimized to
allow very large "queues" of similar objects. It is derived from
Queue.js by Stephen Morley - http://code.stephenmorley.org/

NOTE: this code is emphatically not reentrant / parallelizable!

Created by Rudolf Potucek - http://artiverse.net/ - and released under
the terms of the CC0 1.0 Universal legal code:

http://creativecommons.org/publicdomain/zero/1.0/legalcode

*/

/* Creates a new queue. A queue is a first-in-first-out (FIFO) data structure -
 * items are added to the end of the queue and removed from the front. 
 * [
 *   { enqueue_time: t 
 *     data: [ ] - index = iteration (0=initial request, 1-n=retry n), value - n
 *   }
 * ]
 */
function RequestQueue(){

  // initialise the queue and offset
  var queue  = [];
  var offset = 0;

  // Returns the length of the queue, ignoring content semantics
  this.getLengthQueue = function(){
    return (queue.length - offset);
  }

  // Returns true if the queue is empty, and false otherwise, igoring content semantics
  this.isEmptyQueue = function(){
    // return ((queue.length - offset) == 0);
    return (queue.length == 0);
  }

  /* Enqueues the specified item without content semantics. The parameter is:
   *
   * item - the item to enqueue
   */
  this.enqueueQueue = function(item){
    queue.push(JSON.parse(JSON.stringify(item)));
  }

  /* Enqueues the specified item with content semantics. The parameter is:
   *
   * enqueue_time - timestamp
   * iteration - 0=initial, 1-n retry n
   * number - number of requests to fabricate
   */
  this.enqueueRequests = function(enqueue_time,iteration,number){
    var push_index;
    var last_entry;

    if (queue.length-offset > 0) {
      last_entry = JSON.parse(JSON.stringify(queue[queue.length-1]));
      if (last_entry.t == enqueue_time) {
        // console.log("Enqueue[" + iteration + "]: match last " + last_entry.t + " vs " + enqueue_time);
        push_index = queue.length-1;
      } else {
        // console.log("Enqueue[" + iteration + "]: add   last " + last_entry.t + " vs need " + enqueue_time);
        last_entry = {t:enqueue_time,d:[]};
        push_index=queue.length;  
      }
    } else {
      last_entry = {t:enqueue_time,d:[]};
      push_index=queue.length;  
    }

    if (last_entry.d[iteration] === undefined) { 
      last_entry.d[iteration] = number;
    } else {
      last_entry.d[iteration] += number;
    }
    queue[push_index]=last_entry;
  }

  // /* Enqueues the specified item. The parameter is:
  //  *
  //  * items - and array to enqueue 
  //  */
  // this.enqueuearray = function(items){
  //   if( Object.prototype.toString.call(items) === '[object Array]' ) {
  //     queue.push.apply(queue,items);
  //   } else {
  //     queue.push(item);
  //   }
  // }

  /* Dequeues an item and returns it without content semantics. If the queue is empty, the value
   * 'undefined' is returned.
   */
  this.dequeueQueue = function(){

    // if the queue is empty, return immediately
    if (queue.length == 0) return undefined;

    // store the item at the front of the queue
    var item = queue[offset];

    // increment the offset and remove the free space if necessary
    if (++ offset * 2 >= queue.length){
      queue  = queue.slice(offset);
      offset = 0;
    }

    // return the dequeued item
    return JSON.parse(JSON.stringify(item));

  }

  /* Dequeues a group of items and returns it without content semantics. If the queue is empty, the value
   * 'undefined' is returned.
   */
  this.dequeueArrayQueue = function(listlength){

    // if the queue is empty or we are asking for less than one element, return immediately
    if ((queue.length == 0) || (listlength < 1)) return [];

    // store the item at the front of the queue
    var list = queue.slice(offset,offset+listlength);

    // increment the offset and remove the free space if necessary
    offset += listlength;
    if ((offset) * 2 >= queue.length){
      queue  = queue.slice(offset);
      offset = 0;
    }

    // return the dequeued item
    return JSON.parse(JSON.stringify(list));

  }

  /* Introspects a single request element and counts all contained requests. 
   * This will sum over first and subsequent iterations and return an array
   * of lengths:
   * 0: sum of all iterations
   * 1: length of initial request queue
   * 2: length of first retry queue ... 
   */
  this.getLengthRequest = function(index) {
    var ii;
    // var count = Array.prototype.map.call(queue[index+offset].d.length,function() { return 0; });
    // var count = Array.apply(null, Array(queue[index+offset].d.length)).map(function() { return 0 });
    var count = [];
    var tc = 0;

    // Check to make sure we have an appropriate element
    if ((index < 0) || (queue.length == 0) || (queue.length < index + offset)) {
      return [0];
    }

    // sum over total duration of all elements
    for (ii=0; ii<queue[index+offset].d.length; ii++) {
      count[ii] = queue[index+offset].d[ii] | 0;
    }

    // sum of sums in [0] element
    for (ii=0; ii<queue[index+offset].d.length; ii++) {
      tc+=count[ii];
    }
    count.unshift(tc);

    return count;
  }

  /* Introspects the whole list of request elements and counts all contained requests. 
   * This will sum over first and subsequent iterations and return an array
   * of lengths:
   * 0: sum of all iterations
   * 1: length of initial request queue
   * 2: length of first retry queue ... 
   */
  this.getLengthRequests = function() {
    var ii = 0;
    var jj = 0;
    var ql = [0];
    var rs = [0];

    for (ii=0; ii<this.getLengthQueue(); ii++) {
      rs = this.getLengthRequest(ii);
      for (jj=0; jj<rs.length; jj++) {
        ql[jj] = (ql[jj] | 0) + (rs[jj] | 0);
      }
      console.log(ql + " - " + rs)
    }
    return ql;
  }

  /* This will splice off numentries from the queue element. It will keep the
   * original queue element in place but with reduced entry count and will
   * return a new queue element with at most the requested entry count */
  this.elementSpliceRequest = function(index,numentries) {
    var tq = {t:undefined,d:[]};
    var ii;
    var tc;
    var count = 0;

    // Check to make sure we have an appropriate element
    if ((index < 0) || (numentries < 1) || (queue.length <= offset) || (queue.length < index + offset)) {
      return tq;
    }

    // there should be another sanity check here to make sure that the request
    // actually contains enough entries to be split ...

    tq.t = queue[index+offset].t;
    for (ii=0; ii<queue[index+offset].d.length; ii++) {
      tc = queue[index+offset].d[ii] | 0;
      if (count + tc <= numentries) {
        tq.d[ii] = tc;
        queue[index+offset].d[ii]=0;
        count += tc;
      } else {
        tq.d[ii]                   = (tq.d[ii] | 0) + numentries - count;
        queue[index+offset].d[ii] -= numentries - count;
        count                      = numentries;
        break;
      }
    }
    return JSON.parse(JSON.stringify({ tq:tq, count:count }));

  }

  /*
   * This will dequeue queue elements containing at most the specified number
   * of request; The last queue elemet is likely to be synthetic, generated from
   * splitting the content of the last examined queue element 
   * into this newly created element
   */
  this.dequeueRequests = function(numentries) {
    var ii;
    var tc; // temp counter for entries
    var ec = 0; // counter for entries to be popped
    var count = 0; // counter for actual total number of entries returned 
    var res = undefined;
    var list;

    // if the queue is empty, or we are asking for less than 1 element return immediately
    if ((queue.length <= offset) || (numentries < 1)) return [];

    // iterate over entries
    for (ii=0; ii<queue.length-offset; ii++) {
      tc = this.getLengthRequest(ii)[0];
      if (count + tc <= numentries) { 
        ec++; 
        count += tc; 
        // minor ugliness to delete empty elements off queue
        if (count == numentries) break;
      } else {
        res = this.elementSpliceRequest(ii,numentries-count);
        count += res.count;
        break;
      }
    }

    // splice and dice
    list = queue.slice(offset,offset+ec);
    if (res !== undefined) list.push(res.tq)

    // increment the offset and remove the free space if necessary
    offset += ec;
    if ((offset) * 2 >= queue.length){
      queue  = queue.slice(offset);
      offset = 0;
    }

    // return the dequeued item
    return JSON.parse(JSON.stringify({ tq:list, count:count }));    
  }

  /* Does a search to find all requests - might have to become binary search
   */
  this.findAtTimeRequests = function(time) {
    var ii=0;
    var list = [];
    // Make sure we have a queue to work on
    if (queue.length <= offset) return [];

    for (var ii=offset; ii<queue.length; ii++) {
      if (queue[ii].t == time) {
        list.push(queue[ii]);
      }
    }
    return JSON.parse(JSON.stringify(list));
  }

  /* Returns the item at the front of the queue (without dequeuing it). If the
   * queue is empty then undefined is returned.
   */
  this.peekQueue = function(){
    return (queue.length > 0 ? queue[offset] : undefined);
  }

  this.peekAtQueue = function(index) {
    if (queue.length >0 && index + offset < queue.length) {
        return queue[index+offset];
    } else {
        return undefined;
    }
  }

  this.getOffsetQueue = function() {
    return offset;
  }
}