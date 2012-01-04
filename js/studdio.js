(function(window, undefined){
    var self = {};

    self.Router = Backbone.Router.extend({
        routes: {
            "login/":               "login",
            "login/:message/":      "login",
            ":user/":               "user",
            ":user/:set/":          "flashcard",
            ":user/:set/:card/":    "flashcard"
            //"help":                 "help",    // #help
            //"search/:query":        "search",  // #search/kiwis
            //"search/:query/p:page": "search"   // #search/kiwis/p7
        },
        login: function(message){
            Studdio.LoginView = new Studdio.loginView();
            Studdio.LoginView.render();
        },
        user: function(user, set){

        },
        flashcard:function(user, set, card){
            Studdio.Set = new Studdio.dataSet();
            Studdio.Set.url = '/api/set.json?user=' + user + '&set=' + set;
            Studdio.View = new Studdio.flashCardSetView({model: self.Set});

            if(card)Studdio.View.startAt = card;
            Studdio.View.model.fetch();
        },
        help: function() {
            return false;
        },

        search: function(query, page) {
            return false;
        }

    });

    //Backbone.history.start({pushState: true});
    self.term = Backbone.Model.extend();

    self.user = Backbone.Model.extend({
        initialize: function(){
          this.bind('change', this.home, this);
        },
        username:function(){
            return this.get('username');
        },
        home: function(){
            var me = this.get('username');
            if (me = undefined){
                Studdio.App.navigate( "login/", true);
            } else {
                Studdio.App.navigate( this.get('username') + "/", true);
            }
        }
    });

    self.dataSet = Backbone.Collection.extend({
        model: self.term
    });

    self.flashCardSetView = Backbone.View.extend({
        el: $('div[role="flash_cards_view"]'),
        startAt: 0,
        initialize: function(){
          this.model.bind('all', this.render, this);
          this.model.view = this;
        },

        render: function( event ){
            var compiled_template = Handlebars.compile( $("#flash-cards-display-template").html() );

            this.el.html(
                compiled_template(this.model.toJSON()[0])
            );

            $('article', this.el).each(
                function(index, value){
                    $(value).attr('pos', index)
                }
            )

            var newSelection = $('article',this.el).eq(Studdio.View.startAt);

            if( this.setSelected ){
                this.setSelected(newSelection)
            }else{
                Studdio.View.setSelected(newSelection);
            }

            return this; //recommended as this enables calls to be chained.
        },
        events: {
            "click article.flash-card-selected": "flip"
        },
        flip: function(event){
            $('article.flash-card-selected section').toggleClass('flash-card-current-side');
        },
        prev: function( event ){
            var newPos = parseInt($('article.flash-card-selected').attr('pos')) - 1;
            var newSelected = $('article.flash-card').eq( newPos );
            Studdio.View.setSelected(newSelected);
        },
        next: function( event ){
            var newPos = parseInt($('article.flash-card-selected').attr('pos')) + 1;
            var newSelected = $('article.flash-card').eq( newPos ) ;
            if(newSelected.length === 0){newSelected = $('article.flash-card').eq(0)}
            Studdio.View.setSelected(newSelected);
        },
        setSelected: function(newSelection){
            if( $('article.flash-card-selected').length > 0 ){
                $('article.flash-card-selected').unbind('dragstop');
                $('article.flash-card-selected').draggable( "destroy" );
                $('article.flash-card-selected').removeClass('flash-card-selected');
            }

            Studdio.App.navigate( this.model.toJSON()[0]['owner'] + "/0/" + newSelection.attr('pos') + "/");

            newSelection.addClass('flash-card-selected');
            $('article.flash-card-selected').draggable({ axis: "x" , distance: 100, revert: true });
            $('article.flash-card-selected').bind('dragstop', function(event){Studdio.View.slideHandler(event)})
        },
        slideHandler: function(event){
            var offset = $('article.flash-card-selected').data('draggable')['position']['left'];
            if( offset > 0 ){
                this.next();
            } else if (offset < 0){
                this.prev();
            }
        }
    });

    self.loginView = Backbone.View.extend({
        el: $('div[role="login"]'),

        events: {
            "click #login-button": "auth"
        },

        render: function( event ){
            var compiled_template = Handlebars.compile( $("#login-form-template").html() );

            this.el.html(
                compiled_template()
            );
        },

        auth: function(event){
            var user = $('.login-form-container input[name="username"]').val();
            if (user === ''){
                Studdio.App.navigate( "login/failure/", false);
            } else {
                this.el.html('');
                Studdio.App.navigate( user + "/0/", true);
            }

            return false;
        }
    })

    self.App = new self.Router;
    Backbone.history.start({pushState:true});

    window.Studdio = self;

    Studdio.User = new Studdio.user();
    Studdio.User.url = '/api/user.json';
    Studdio.User.fetch();
})(window);
