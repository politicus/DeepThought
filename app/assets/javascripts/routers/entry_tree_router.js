DeepThought.Router = Backbone.Router.extend({

  routes: {
    "": "rootShow",
    "entries/:id" : "nodeShow"
  },

  rootShow: function(){
    this.nodeShow(1)
  },

  nodeShow: function(id){
    var node = DeepThought.rootCollection.get(id);
    DeepThought.collections = new Object();
    var children = DeepThought.rootCollection.where({parent_id : parseInt(id)});
    var nodeShow = new DeepThought.Views.nodeView({
      collection: new DeepThought.Collections.EntryTree(children),
      itemView: DeepThought.Views.treeView,
      root_id: id
    });

    var render = nodeShow.render();
    $("#content").html(render.$el);

    // var headerShow = new DeepThought.Views.headerView({
    //   model: node
    // });

    // $("#content").prepend(headerShow.render().$el)

    // var header = JST['entry_tree/header']({
    //   node: node
    // });
    // $("#content").prepend(header);
  }
});
