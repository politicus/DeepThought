DeepThought.Views.treeView = Backbone.Marionette.CompositeView.extend({
  template: 'entry_tree/nodeForm',
  templateHelpers: function() {
    return { model:this.model};
  },
  tagName: "li",
  className: "droppable list",
  itemView: DeepThought.Views.treeView,
  itemViewOptions: function(){
    return {siblings: this.siblings,
      parent: this.model,
      root_id: this.root_id,
      className: "child list"}; //className to add vertical tablines css
  },

  initialize: function(options) {
    this.collection = DeepThought.allCollections[this.model.get("id")] || new DeepThought.Collections.EntryTree();
    DeepThought.allCollections[this.model.get("id")] = this.collection;
    DeepThought.allParents[this.model.get("id")] = DeepThought.allParents[this.model.get("id")] || this.model.get("parent_id");
    (this.$el).attr("id",this.model.get("id"));
    (this.$el).addClass(this.options.className);
    this.root_id = parseInt(this.options.root_id);
  },

  onRender: function() { //to initially deal with expanded items.
    var that = this;
    if (this.model.get("expanded") === false) {
      setTimeout(function() {
        $("#ul"+that.model.get("id")).toggle();
        $("#bullet"+that.model.get("id")).addClass("bullet-shadow");
      }, 0);
    }
  },

  appendHtml: function(collectionView,itemView) {
    var itemIndex = DeepThought.allCollections[itemView.model.get("parent_id")].models.indexOf(itemView.model);
    var prevItem = DeepThought.allCollections[itemView.model.get("parent_id")].models[itemIndex - 1]
    if (itemView.model.get("is_new")) {
      if (prevItem) {
        collectionView.$("#"+prevItem.get("id")).after(itemView.el);
      } else {
        collectionView.$("#ul"+itemView.model.get("parent_id")).prepend(itemView.el);
      }
    } else {
      collectionView.$("#ul"+itemView.model.get("parent_id")).append(itemView.el);
    }

    $('textarea').autosize();
  },

  events: {
    "change": "saveEntry",
    "click .view-toggle" : "toggleView",
    "mouseover" : "displayButtons",
    "mouseout" : "hideButtons",
    "keydown :input" : "keyHandler",
    "drop" : "dropHandler",
    "dragstart" : "dragstartHandler",
    "dragstop": "dragstopHandler",
  },

  // dropHandler: function() {
  //   console.log("you dropped!");
  // },

  // dragstartHandler: function() {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   console.log(event.target);
  //   console.log(event.currentTarget);
  //   this.$("#"+this.model.get("id")).addClass("draggedList");
  //   this.$("#arrow"+this.model.get("id")).css({color:"black"});
  //   console.log(this.model);
  //   console.log("ONE AT A TIME?!!!!");
  // },

  // dragstopHandler: function() {
  //   $("#"+this.model.get("id")).removeClass("draggedList");
  //   $("#arrow"+this.model.get("id")).css({color:"gray"});
  //   console.log("STOPSOTPSOTOPSOPOST");

  // },

  focusOnTextArea: function(el) {
    el.firstElementChild.getElementsByTagName("textarea")[0].focus();
  },

  saveEntry: function(event, callback) {
    callback = callback || function() {};
    event.stopPropagation();
    var id = this.model.get("id");
      var formData = $("#form"+id).serializeJSON();
      var that = this;
      this.model.save(formData, {success: function() {
        if (DeepThought.rootCollection.get(id)) {//in the event it was just deleted
          DeepThought.rootCollection.get(id).save({"title": formData.entry.title}, {wait: true, success: callback()});
        }
      }
    });
  },

  keyHandler:function() {
    event.stopPropagation();
    switch(event.which) {
      case 13: //enter key
        if (event.shiftKey) {
          this.completeEntry(event);
        } else {
          this.enterEntry(event);
        }
        break;
      case 8: //backspace
        this.backspaceEntry(event);
        // event.currentTarget.title
        // var title = $("#form"+this.model.get("id")).serializeJSON().entry.title;
        // if (title.length === 0){
        //   event.preventDefault();
        //   this.deleteEntry(event);
        // }
        break;
      case 9: //tabbing
        if (event.shiftKey){
          this.tabBackward(event);
        } else { 
          this.tabForward(event);
        }
        break;
      case 38: //up arrow
        if (event.shiftKey)
          this.moveUp(event);
        else
           this.goUp(event);
        break;
      case 40: //down arrow
        if (event.shiftKey){
          this.moveDown(event);
        } else {
          this.goDown(event);
        }
        break;
      case 39: //right arrow
        if (event.ctrlKey) {
          this.zoomIn(event);
        } else if (event.shiftKey){
          this.tabForward(event);
        }
        break;
      case 37: //left arrow
        if (event.ctrlKey)
          this.zoomOut(event);
        else if (event.shiftKey)
          this.tabBackward(event);
        break;
      case 32:
        if (event.shiftKey)
          this.toggleView(event);
    }
    this.$el.focus();
  },

  // completeEntry: function() {
  //   event.stopPropagation();
  //   event.preventDefault();
  //   console.log("here");
  //   $("#"+this.model.id).toggleClass("completed");
  //   this.model.save({"completed" : true}, {success: function(){
  //     this.render();      
  //   }})

  // },

  displayButtons: function() {
    event.stopPropagation();
    $("#button"+this.model.id).css({opacity: 1});
    $("#arrow"+this.model.id).css({opacity: 1, zIndex: 10});
  },

  hideButtons: function() {
    event.stopPropagation();
    $("#button"+this.model.id).css({opacity: 0});
    $("#arrow"+this.model.id).css({opacity: 0});
  },

  toggleView: function(){
    event.preventDefault();
    event.stopPropagation();
    var that = this;
    var newExpanded = !this.model.get("expanded")

    this.model.save({"expanded" : newExpanded},
      {success: function(){ 
        that.model.set({"expanded" : newExpanded});
        $("#bullet"+ that.model.get("id")).toggleClass("bullet-shadow");
        var button = $("#button"+that.model.get("id"));
        button.attr("value", (button[0].value === '+' ? '-' : '+'));
        $("#ul"+that.model.get("id")).slideToggle(300);
      }
    })
  },

  zoomIn:function(event) {
    var that = this;
    this.saveEntry(event, function() {
      DeepThought.router.navigate("#/entries/"+that.model.get("id"));    
    });

  },

  zoomOut:function(event) {
    var that = this;
    this.saveEntry(event, function(){
      var grandparent_id = that.findGrandparent(that.model);
      console.log(grandparent_id);
      if(grandparent_id)
        DeepThought.router.navigate("#/entries/"+grandparent_id);      
    })

  },

  enterEntry: function(event){
    event.preventDefault();
    var caretPos = event.target.selectionStart;
    var oldTitle = $("#form"+this.model.id).serializeJSON().entry.title;
    var newTitle = oldTitle.slice(0, caretPos);
    var that = this;

    if (oldTitle.length === 0){ //if empty, tab out.
      this.tabBackward(event);
      return;

    }

    this.model.save({"title": newTitle} , {success: function() { //splice the old title at caret Position
        DeepThought.rootCollection.get(that.model.id).set({"title": newTitle}, {wait: true})
      }
    });

    $('#ta'+this.model.id).val(newTitle);

    // if (this.model.get("expanded") === false) {
    //     this.expand(this.model);
    // }

    //check if model has a child, if so we only care about the first one
    var firstChild = DeepThought.allCollections[this.model.id].models[0];
    if(firstChild && this.model.get("expanded") === true) { //if children, new entry will be a child
      var rank = firstChild.get("rank") - 1;

      var newEntry = DeepThought.allCollections[this.model.id].create({
        title: oldTitle.slice(caretPos, oldTitle.length), 
        parent_id: this.model.id,
        rank: rank,
        is_new: true},
        {wait: true, success: function() {
          DeepThought.allParents[newEntry.id] = that.model.id;
          DeepThought.rootCollection.add(newEntry);
          that.focusOnTextArea($("#"+newEntry.id)[0]);
        }}
      );
    } else { //model has no children, new entry is a sibling
      var rank = this.findNewRank(this);

      var newEntry = DeepThought.allCollections[this.model.get("parent_id")].create({
        title: oldTitle.slice(caretPos, oldTitle.length), 
        parent_id: this.model.get("parent_id"),
        rank: rank,
        is_new: true},
        {wait: true, success: function() {
          DeepThought.allParents[newEntry.id] = that.model.get("parent_id");
          DeepThought.rootCollection.add(newEntry);
          that.focusOnTextArea($("#"+newEntry.id)[0]);
        }}
      );
    }
  },

  findNewRank: function(view){
    var siblings = DeepThought.allCollections[view.model.get("parent_id")];
    var index = siblings.models.indexOf(view.model);
    var rank = view.model.get("rank");
      if (index === siblings.models.length - 1) {
        return rank + 1;
      } else {
        return (rank + siblings.models[index+1].get("rank"))/2;
      }      
  },

  backspaceEntry: function(event) {
    var caretPos = event.target.selectionStart;

    if (caretPos !== 0 || caretPos !== event.target.selectionEnd) //do default of deleting text
      return;

    event.preventDefault();
    var title = $("#form"+this.model.id).serializeJSON().entry.title;
    var siblings = DeepThought.allCollections[this.model.get("parent_id")].models;
    var index = siblings.indexOf(this.model);
    var children = DeepThought.allCollections[this.model.id].models;
    var parentId = this.model.get("parent_id");
    var that = this;

    if (event.shiftKey) { //force delete
      this.deleteEntry(event);
      return;
    }

    if (title.length === 0 && children.length === 0) { //if empty, delete unless children
        this.deleteEntry(event);
        return;
    }

    if (index === 0) { //if it's under a parent
      if (children.length > 0) { //if it has children, do nothing
        return;
      } else { //combine it with the parent
        var oldParentTitle = $("#form"+parentId).serializeJSON().entry.title;
        var newParentTitle = oldParentTitle + title;
        var parentCollection = DeepThought.allCollections[this.findGrandparent(this.model)];
        $('#ta'+parentId).focus();
        $('#ta'+parentId).val(newParentTitle);
        parentCollection.get(parentId).save({"title":newParentTitle}, {wait: true, success:function() {
          DeepThought.rootCollection.get(parentId).set({"title":newParentTitle}, {wait:true});
          $('#ta'+parentId)[0].setSelectionRange(oldParentTitle.length, oldParentTitle.length);
          that.deleteEntry(event);
        }});
      }
    } else { //if it's under a sibling
      var siblingId = siblings[index - 1].id;
      if (DeepThought.allCollections[siblingId].length !== 0) { //if sibling has children, do nothing
        return;
      } //otherwise combine sibling and model title
      var siblingTitle = $("#form"+siblingId).serializeJSON().entry.title
      var newTitle =  siblingTitle + title;
      $('#ta'+this.model.id).val(newTitle);
      this.model.save({"title": newTitle}, {wait: true, success: function() {
        DeepThought.rootCollection.get(that.model.id).set({"title":newTitle}, {wait:true});
        $('#ta'+that.model.id)[0].setSelectionRange(siblingTitle.length, siblingTitle.length);
      }});
      DeepThought.allCollections[this.model.get("parent_id")].models = _.without(DeepThought.allCollections[this.model.get("parent_id")].models, DeepThought.allCollections[siblingId])
      delete DeepThought.allCollections[siblingId];
      delete DeepThought.allParents[siblingId];
      DeepThought.rootCollection.get(siblingId).destroy();
    }
  },

  deleteEntry: function(event) {
    var id = this.model.get("id");
    this.goUp(event);
    DeepThought.allCollections[this.model.get("parent_id")].models = _.without(DeepThought.allCollections[this.model.get("parent_id")].models, DeepThought.allCollections[id])
    delete DeepThought.allCollections[id];
    delete DeepThought.allParents[id];
    this.model.destroy();
  },

  tabForward: function(event) {
    event.preventDefault();
    var that = this;
    var position = DeepThought.allCollections[this.model.get("parent_id")].models.indexOf(this.model);
    if (position !== 0) {
      var previousSibling = DeepThought.allCollections[this.model.get("parent_id")].models[position - 1];
      if (DeepThought.allCollections[previousSibling.get("id")].length !== 0) {
        var newRank = (_.last(DeepThought.allCollections[previousSibling.get("id")].models).get("rank") + 1);
      } else {
        var newRank = 1;
      }
      if (previousSibling.get("expanded") === false){        
        this.expand(previousSibling);
      }
      this.relocate(this.model, previousSibling.get("id"), newRank);
    }
  },

  expand: function(model) {
    var id = model.get("id");
    model.save({"expanded":true},{success: function() {
      model.set({"expanded":true});
      $("#ul"+id).slideToggle();
      $("#bullet"+id).removeClass("bullet-shadow");
      $("#button"+id).value = '-';
    }});
  },

  tabBackward: function(event) {
    event.preventDefault();
    var that = this;
    if (this.model.get("parent_id") !== this.root_id) {
      var grandparent_id = this.findGrandparent(this.model);
      if (DeepThought.allCollections[grandparent_id]) {
        var parent = DeepThought.allCollections[grandparent_id].get(this.model.get("parent_id"));
        var parentIdx = DeepThought.allCollections[grandparent_id].indexOf(parent);
        if (parent === _.last(DeepThought.allCollections[grandparent_id].models)) {
          var newRank = parent.get("rank") + 1;
        } else {
          var nextRank = DeepThought.allCollections[grandparent_id].models[parentIdx+1].get("rank");
          var newRank = (parent.get("rank") + nextRank)/2
        }
        this.relocate(this.model, grandparent_id, newRank);
      }
    }
  },

  findGrandparent: function(model) {
    var parent_id = DeepThought.allParents[model.get("id")];
    return DeepThought.allParents[parent_id];
  },

  goUp: function(event) {
    event.preventDefault();
    var index = $("textarea.entry-title:visible").index($("#ta"+this.model.get("id")));
    var priorElement = $("textarea.entry-title:visible")[index - 1];
    if (priorElement) {
      priorElement.focus();
    }
  },

  goDown: function(event) {
    event.preventDefault();
    var index = $("textarea.entry-title:visible").index($("#ta"+this.model.get("id")));
    var nextElement = $("textarea.entry-title:visible")[index + 1];
    if (nextElement) {
      nextElement.focus();
    }
  },

  moveUp: function(event) {
    var siblings = DeepThought.allCollections[this.model.get("parent_id")];
    var position = siblings.indexOf(this.model);
    if (position !== 0) {
      var newParentId = this.model.get("parent_id");
      var previousSibling = siblings.models[position - 1];
      if (position === 1) {
        var newRank = previousSibling.get("rank") - 1;
      } else {
        var newRank = (siblings.models[position - 2].get("rank") + previousSibling.get("rank"))/2;
      }
    } else {
      var newParent = this.moveUpHelper(this.model.get("id"), 0);
      if (!newParent)
        return;
      if (newParent.get("expanded") === false)
        this.expand(newParent);
      var newParentId = newParent.get("id");
      if (DeepThought.allCollections[newParentId].models.length === 0) {
        var newRank = 1;
      } else {
        var newRank = _.last(DeepThought.allCollections[newParentId].models).get("rank") + 1;
      }
    }
    var that = this; 
    this.relocate(this.model, newParentId, newRank);
  },

  moveUpHelper: function(model_id, tier) {
    if (!DeepThought.allParents[model_id])
      return undefined;
    var siblings = DeepThought.allCollections[DeepThought.allParents[model_id]].where({expanded: true});
    var position = siblings.indexOf(_.findWhere(siblings, {id: model_id}));
    if (position !== 0) {
      var previousSibling = siblings[position - 1];
      return this.digDownHelper(previousSibling, tier);
    } else {
      return this.moveUpHelper(DeepThought.allParents[model_id], tier + 1)
    }
  },

  digDownHelper: function(previousSibling, tier) {
    if (DeepThought.allCollections[previousSibling.get("id")].models.length === 0 || tier === 1) {
      return previousSibling;
    } else {
      return this.digDownHelper(_.last(DeepThought.allCollections[previousSibling.get("id")].models), tier - 1);
    }
  },

  moveDown: function(event){
    var siblings = DeepThought.allCollections[this.model.get("parent_id")];
    var position = siblings.indexOf(this.model);
    if (position !== siblings.models.length - 1) {
      var newParentId = this.model.get("parent_id");
      nextSibling = siblings.models[position + 1];  
      if (position === siblings.models.length - 2) {
        var newRank = nextSibling.get("rank") + 1;
      } else {
        var newRank = (siblings.models[position + 2].get("rank") + nextSibling.get("rank")) / 2;
      }
    } else {
      var newParent = this.digUpHelper(this.model.get("id"), 0);
      if (!newParent)
        return;
      if (newParent.get("expanded") === false)
        this.expand(newParent);
      var newParentId = newParent.get("id");
      if (DeepThought.allCollections[newParentId].models.length === 0) {
        var newRank = 1;
      } else {
        var newRank = _.first(DeepThought.allCollections[newParentId].models).get("rank") / 2;
      }
    }
    var that = this;
    this.relocate(this.model, newParentId, newRank);
    // DeepThought.allCollections[this.model.get("parent_id")].remove(this.model);
    // this.model.save({rank: newRank, is_new: true, parent_id: newParentId}, {wait: true, success: function(){ 
    //   DeepThought.allCollections[newParentId].add(that.model);
    //   DeepThought.allParents[that.model.get("id")] = newParentId;
    //   $("#ta"+that.model.id).focus();
      //that.focusOnTextArea($("#"+that.model.id)[0]);
    // }});
  },


// var newEntry = DeepThought.allCollections[this.model.get("parent_id")].create({
//         title: oldTitle.slice(caretPos, oldTitle.length), 
//         parent_id: this.model.get("parent_id"),
//         rank: rank,
//         is_new: true},
//         {wait: true, success: function() {
//           DeepThought.allParents[newEntry.id] = that.model.get("parent_id");
//           DeepThought.rootCollection.add(newEntry);
//           that.focusOnTextArea($("#"+newEntry.id)[0]);
//         }}
//       );



  relocate: function(model, new_parent_id, new_rank, focusOption) {
    var focusOn = focusOption !== false;
    var formData = $("#form"+ model.get("id")).serializeJSON();

    var old_parent_id = model.get("parent_id");
    model.save({title: formData["entry"]["title"], parent_id: new_parent_id, rank: new_rank, is_new: true}, {success: function(){
      DeepThought.allCollections[old_parent_id].remove(model);
      DeepThought.allCollections[new_parent_id].set(model, {wait: true, merge:true, remove:false});
      DeepThought.rootCollection.add(model, {wait:true, merge:true});
      DeepThought.rootCollection.fetch();

      DeepThought.allParents[model.get("id")] = new_parent_id;
      if (focusOn)
        $("#ta"+model.get("id")).focus();
    }})
  },

  digUpHelper: function(model_id, tier) {
    var parent_id = DeepThought.allParents[model_id]
    var grandparent = DeepThought.allParents[parent_id]
    if (!grandparent) return;
    var uncles = DeepThought.allCollections[DeepThought.allParents[parent_id]].where({expanded: true});
    var parentPosition = uncles.indexOf(_.findWhere(uncles, {id: parent_id}));
    if (parentPosition === uncles.length - 1) {
      return this.digUpHelper(parent_id, tier + 1);
    } else {
      var nextUncle = uncles[parentPosition + 1];
      return this.moveDownHelper(nextUncle, tier);
    }
  },

  moveDownHelper: function(nextUncle, tier) {
    if (DeepThought.allCollections[nextUncle.get("id")].models.length === 0 || tier === 0) {
      return nextUncle;
    } else {
      return this.moveDownHelper(_.first(DeepThought.allCollections[nextUncle.get("id")].models), tier - 1);
    }
  }

})