// Copyright 2009 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


// A namespace stub. It will become more clear how to declare it properly
// during integration of this script into Dev Tools.
var goog = goog || {};
goog.structs = goog.structs || {};


/**
 * Constructs a Splay tree.  A splay tree is a self-balancing binary
 * search tree with the additional property that recently accessed
 * elements are quick to access again. It performs basic operations
 * such as insertion, look-up and removal in O(log(n)) amortized time.
 *
 * @constructor
 */
goog.structs.SplayTree = function() {
};


/**
 * Pointer to the root node of the tree.
 *
 * @type {goog.structs.SplayTree.Node}
 * @private
 */
goog.structs.SplayTree.prototype.root_ = null;


/**
 * @return {boolean} Whether the tree is empty.
 */
goog.structs.SplayTree.prototype.isEmpty = function() {
  return !this.root_;
};



/**
 * Inserts a node into the tree with the specified key and value if
 * the tree does not already contain a node with the specified key. If
 * the value is inserted, it becomes the root of the tree.
 *
 * @param {number} key Key to insert into the tree.
 * @param {*} value Value to insert into the tree.
 */
goog.structs.SplayTree.prototype.insert = function(key, value) {
  if (this.isEmpty()) {
    this.root_ = new goog.structs.SplayTree.Node(key, value);
    return;
  }
  // Splay on the key to move the last node on the search path for
  // the key to the root of the tree.
  this.splay_(key);
  if (this.root_.key == key) {
    return;
  }
  var node = new goog.structs.SplayTree.Node(key, value);
  if (key > this.root_.key) {
    node.left = this.root_;
    node.right = this.root_.right;
    this.root_.right = null;
  } else {
    node.right = this.root_;
    node.left = this.root_.left;
    this.root_.left = null;
  }
  this.root_ = node;
};


/**
 * Removes a node with the specified key from the tree if the tree
 * contains a node with this key. The removed node is returned. If the
 * key is not found, an exception is thrown.
 *
 * @param {number} key Key to find and remove from the tree.
 * @return {goog.structs.SplayTree.Node} The removed node.
 */
goog.structs.SplayTree.prototype.remove = function(key) {
  if (this.isEmpty()) {
    throw Error('Key not found: ' + key);
  }
  this.splay_(key);
  if (this.root_.key != key) {
    throw Error('Key not found: ' + key);
  }
  var removed = this.root_;
  if (!this.root_.left) {
    this.root_ = this.root_.right;
  } else {
    var right = this.root_.right;
    this.root_ = this.root_.left;
    // Splay to make sure that the new root has an empty right child.
    this.splay_(key);
    // Insert the original right child as the right child of the new
    // root.
    this.root_.right = right;
  }
  return removed;
};


/**
 * Returns the node having the specified key or null if the tree doesn't contain
 * a node with the specified key.
 *
 * @param {number} key Key to find in the tree.
 * @return {goog.structs.SplayTree.Node} Node having the specified key.
 */
goog.structs.SplayTree.prototype.find = function(key) {
  if (this.isEmpty()) {
    return null;
  }
  this.splay_(key);
  return this.root_.key == key ? this.root_ : null;
};


/**
 * @return {goog.structs.SplayTree.Node} Node having the minimum key value.
 */
goog.structs.SplayTree.prototype.findMin = function() {
  if (this.isEmpty()) {
    return null;
  }
  var current = this.root_;
  while (current.left) {
    current = current.left;
  }
  return current;
};


/**
 * @return {goog.structs.SplayTree.Node} Node having the maximum key value.
 */
goog.structs.SplayTree.prototype.findMax = function(opt_startNode) {
  if (this.isEmpty()) {
    return null;
  }
  var current = opt_startNode || this.root_;
  while (current.right) {
    current = current.right;
  }
  return current;
};


/**
 * @return {goog.structs.SplayTree.Node} Node having the maximum key value that
 *     is less or equal to the specified key value.
 */
goog.structs.SplayTree.prototype.findGreatestLessThan = function(key) {
  if (this.isEmpty()) {
    return null;
  }
  // Splay on the key to move the node with the given key or the last
  // node on the search path to the top of the tree.
  this.splay_(key);
  // Now the result is either the root node or the greatest node in
  // the left subtree.
  if (this.root_.key <= key) {
    return this.root_;
  } else if (this.root_.left) {
    return this.findMax(this.root_.left);
  } else {
    return null;
  }
};


/**
 * @return {Array<*>} An array containing all the values of tree's nodes.
 */
goog.structs.SplayTree.prototype.exportValues = function() {
  var result = [];
  this.traverse_(function(node) { result.push(node.value); });
  return result;
};


/**
 * Perform the splay operation for the given key. Moves the node with
 * the given key to the top of the tree.  If no node has the given
 * key, the last node on the search path is moved to the top of the
 * tree. This is the simplified top-down splaying algorithm from:
 * "Self-adjusting Binary Search Trees" by Sleator and Tarjan
 *
 * @param {number} key Key to splay the tree on.
 * @private
 */
goog.structs.SplayTree.prototype.splay_ = function(key) {
  if (this.isEmpty()) {
    return;
  }
  // Create a dummy node.  The use of the dummy node is a bit
  // counter-intuitive: The right child of the dummy node will hold
  // the L tree of the algorithm.  The left child of the dummy node
  // will hold the R tree of the algorithm.  Using a dummy node, left
  // and right will always be nodes and we avoid special cases.
  var dummy, left, right;
  dummy = left = right = new goog.structs.SplayTree.Node(null, null);
  var current = this.root_;
  while (true) {
    if (key < current.key) {
      if (!current.left) {
        break;
      }
      if (key < current.left.key) {
        // Rotate right.
        var tmp = current.left;
        current.left = tmp.right;
        tmp.right = current;
        current = tmp;
        if (!current.left) {
          break;
        }
      }
      // Link right.
      right.left = current;
      right = current;
      current = current.left;
    } else if (key > current.key) {
      if (!current.right) {
        break;
      }
      if (key > current.right.key) {
        // Rotate left.
        var tmp = current.right;
        current.right = tmp.left;
        tmp.left = current;
        current = tmp;
        if (!current.right) {
          break;
        }
      }
      // Link left.
      left.right = current;
      left = current;
      current = current.right;
    } else {
      break;
    }
  }
  // Assemble.
  left.right = current.left;
  right.left = current.right;
  current.left = dummy.right;
  current.right = dummy.left;
  this.root_ = current;
};


/**
 * Performs a preorder traversal of the tree.
 *
 * @param {function(goog.structs.SplayTree.Node)} f Visitor function.
 * @private
 */
goog.structs.SplayTree.prototype.traverse_ = function(f) {
  var nodesToVisit = [this.root_];
  while (nodesToVisit.length > 0) {
    var node = nodesToVisit.shift();
    if (node == null) {
      continue;
    }
    f(node);
    nodesToVisit.push(node.left);
    nodesToVisit.push(node.right);
  }
};


/**
 * Constructs a Splay tree node.
 *
 * @param {number} key Key.
 * @param {*} value Value.
 */
goog.structs.SplayTree.Node = function(key, value) {
  this.key = key;
  this.value = value;
};


/**
 * @type {goog.structs.SplayTree.Node}
 */
goog.structs.SplayTree.Node.prototype.left = null;


/**
 * @type {goog.structs.SplayTree.Node}
 */
goog.structs.SplayTree.Node.prototype.right = null;