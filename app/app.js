// Generated by CoffeeScript 1.3.3
var $, AlbumView, AppRouter, ArtistColumnView, ArtistView, COLUMN_WIDTH, CollectionView, ColumnView, DoubleLineTextView, FauxAlbumView, IMAGE_SIZE, MediaView, PlaylistView, TrackView, UserView;

if (!$) {
  $ = Backbone.$;
}

COLUMN_WIDTH = 234;

COLUMN_WIDTH = 300;

IMAGE_SIZE = 48;

MediaView = Backbone.View.extend({
  tagName: 'tr',
  className: 'sp-list-item',
  template: _.template(($('#table-list-item-template')).html()),
  events: {
    click: 'click'
  },
  getModel: function(model) {
    return model;
  },
  initialize: function(options) {
    var _ref;
    this.parentView = options != null ? options.parentView : void 0;
    this.model = this.getModel(options != null ? options.model : void 0);
    return (_ref = this.model) != null ? _ref.load('name') : void 0;
  },
  render: function() {
    var _this = this;
    this.$el.html(this.template());
    if (this.model) {
      this.load(this.model, function(model) {
        _this.$('.sp-list-cell-image').append((_this.image(model)).node);
        return _this.$('.sp-list-cell-track').text(_this.text(model));
      });
    }
    return this;
  },
  click: function() {
    this.parentView.click(this);
    return this.route(this.model, this.parentView);
  }
});

AlbumView = MediaView.extend({
  getModel: function(model) {
    if (_.has(model, 'albums')) {
      return model.albums[0];
    } else {
      return model;
    }
  },
  load: function(model, callback) {
    return (model.load('name')).always(function(model, err) {
      if (err) {
        console.log(err);
      }
      if (!err) {
        return callback(model);
      }
    });
  },
  image: function(album) {
    return Image.forAlbum(album, {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      style: 'plain',
      animate: false
    });
  },
  text: function(album) {
    return album.name;
  },
  route: function(album, parentView) {
    return router.album(album, parentView);
  },
  render: function() {
    var artists, title, view;
    this.$el.html(this.template());
    if (this.model) {
      this.$('.sp-list-cell-image').append((this.image(this.model)).node);
      title = this.model.name;
      artists = (_.map(this.model.artists, function(artist) {
        return artist.name;
      })).join(', ');
      view = new DoubleLineTextView({
        primaryText: title,
        secondaryText: artists
      });
      (view.setElement(this.$('.sp-list-cell-track'))).render();
    }
    return this;
  }
});

FauxAlbumView = AlbumView.extend({
  getModel: function(model) {
    return model;
  },
  image: function(playlist) {
    return Image.forPlaylist(playlist, {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      style: 'plain',
      animate: false
    });
  },
  route: function(playlist, parentView) {
    return router.playlist(playlist, parentView);
  },
  render: function() {
    var _this = this;
    this.$el.html(this.template());
    if (this.model) {
      async.waterfall([
        (function(model) {
          return function(callback) {
            return (model.load('tracks')).always(function(model, err) {
              return callback(err, model.tracks);
            });
          };
        })(this.model), function(tracks, callback) {
          return tracks.snapshot(0, 1).always(function(tracks, err) {
            return callback(err, tracks);
          });
        }, function(tracks, callback) {
          var track;
          track = tracks.get(0);
          return (track.load('artists', 'album')).always(function(track, err) {
            return callback(err, track);
          });
        }, function(track, callback) {
          var f;
          f = {
            artists: (function(artists) {
              return function(callback) {
                var name;
                name = function(artist, callback) {
                  return (artist.load('name')).always(function(artist, err) {
                    return callback(err, artist);
                  });
                };
                return async.map(artists, name, callback);
              };
            })(track.artists),
            album: (function(album) {
              return function(callback) {
                return (album.load('name')).always(function(album, err) {
                  return callback(err, album);
                });
              };
            })(track.album)
          };
          return async.parallel(f, callback);
        }
      ], function(err, _arg) {
        var album, artists, view;
        artists = _arg.artists, album = _arg.album;
        if (err) {
          if (err) {
            return (_this.$('.sp-list-cell-track')).text(err);
          }
        }
        artists = (_.map(artists, function(artist) {
          return artist.name;
        })).join(', ');
        album = album.name;
        view = new DoubleLineTextView({
          primaryText: album,
          secondaryText: artists
        });
        (view.setElement(_this.$('.sp-list-cell-track'))).render();
        return (_this.$('.sp-list-cell-image')).append((_this.image(_this.model)).node);
      });
    }
    return this;
  }
});

ArtistView = MediaView.extend({
  load: function(model, callback) {
    return (model.load('name')).always(function(model, err) {
      if (!err) {
        return callback(model);
      }
    });
  },
  image: function(artist) {
    return Image.forArtist(artist, {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      style: 'plain',
      animate: false
    });
  },
  text: function(artist) {
    return artist.name;
  },
  route: function(artist, parentView) {
    return router.artist(artist, parentView);
  }
});

TrackView = MediaView.extend({
  load: function(model, callback) {
    return (model.load('name', 'artists')).always(function(model, err) {
      if (!err) {
        return callback(model);
      }
    });
  },
  image: function(track) {
    return {
      node: null
    };
  },
  text: function(track) {
    return track.name;
  },
  route: function(track, parentView) {
    return router.track(track, parentView);
  },
  render: function() {
    var _this = this;
    this.$el.html(this.template());
    if (this.model) {
      this.load(this.model, function(model) {
        var view;
        _this.$('.sp-list-cell-image').append((_this.image(_this.model)).node);
        view = new DoubleLineTextView({
          primaryText: _this.model.name,
          secondaryText: (_.map(_this.model.artists, function(artist) {
            return artist.name;
          })).join(', ')
        });
        return (view.setElement(_this.$('.sp-list-cell-track'))).render();
      });
    }
    return this;
  }
});

PlaylistView = MediaView.extend({
  load: function(model, callback) {
    return (model.load('name')).always(function(model, err) {
      if (!err) {
        return callback(model);
      }
    });
  },
  image: function(playlist) {
    return Image.forPlaylist(playlist, {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      style: 'plain',
      animate: false
    });
  },
  text: function(playlist) {
    return playlist.name;
  },
  route: function(playlist, parentView) {
    return router.playlist(playlist, parentView);
  }
});

UserView = MediaView.extend({
  load: function(model, callback) {
    return callback(model);
  },
  image: function(user) {
    return Image.forUser(user, {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      style: 'plain',
      animate: false
    });
  },
  text: function(user) {
    return user.username;
  },
  route: function(user, parentView) {
    return router.user(user, parentView);
  }
});

DoubleLineTextView = Backbone.View.extend({
  template: _.template(($('#text-template')).html()),
  initialize: function(options) {
    return this.primaryText = options.primaryText, this.secondaryText = options.secondaryText, this.model = options.model, options;
  },
  render: function() {
    return this.$el.html(this.template({
      primary: this.primaryText,
      secondary: this.secondaryText
    }));
  }
});

CollectionView = Backbone.View.extend({
  tagName: 'tbody',
  className: 'sp-list-table-body',
  offset: 0,
  length: 30,
  isLoading: false,
  events: {
    scroll: 'scroll'
  },
  initialize: function(options) {
    return this.itemView = options.itemView, this.model = options.model, options;
  },
  render: function() {
    if (!this.model) {
      return this;
    }
    this.fetch();
    return this;
  },
  fetch: function() {
    var p,
      _this = this;
    p = this.model.snapshot(this.offset, 150);
    return p.always(function(snapshot, err) {
      var i, length, offset, _i, _ref, _ref1, _results;
      if (err) {
        return console.log('error at fetch', err);
      }
      _ref = snapshot.range, offset = _ref.offset, length = _ref.length;
      length = Math.min(length, 150);
      _results = [];
      for (i = _i = offset, _ref1 = offset + length; _i < _ref1; i = _i += 1) {
        _results.push((function(i) {
          var view;
          view = new _this.itemView({
            model: snapshot.get(i),
            parentView: _this
          });
          return _this.$el.append(view.render().el);
        })(i));
      }
      return _results;
    });
  },
  scroll: function() {
    if (this.el.scrollTop + this.el.clientHeight + 10 > this.el.scrollHeight) {
      this.offset += this.length;
      return this.fetch();
    }
  },
  click: function(view) {
    var _ref;
    if ((_ref = this.selectedView) != null) {
      _ref.$el.css({
        background: '#ECEBE8'
      });
    }
    view.$el.css({
      background: '#d0d0d0'
    });
    return this.selectedView = view;
  }
});

ColumnView = Backbone.View.extend({
  tagName: 'div',
  className: 'sp-list sp-list-fixed-height sp-list-layout-toplist column',
  template: _.template(($('#table-list-template')).html()),
  initialize: function(options) {
    this.subview = options.subview, this.depth = options.depth, this.href = options.href;
    return this.subview.parentView = this;
  },
  render: function() {
    var $el, template;
    $el = this.$el, template = this.template;
    $el.html(template());
    (this.subview.setElement(this.$('.sp-list-table-body'))).render();
    $el.height(($('document')).height());
    return this;
  }
});

ArtistColumnView = ColumnView.extend({
  template: _.template(($('#table-list-artist-template')).html()),
  render: function() {
    var $el, template;
    $el = this.$el, template = this.template;
    $el.html(template());
    (this.subview.setElement(this.$('.sp-list-table-body'))).render();
    $el.height(($('document')).height());
    return this;
  }
});

AppRouter = Backbone.Router.extend({
  views: [],
  columns: [],
  routes: {
    playlists: 'playlists',
    fauxPlaylists: 'fauxPlaylists',
    albums: 'albums',
    artists: 'artists',
    labels: 'labels',
    friends: 'friends'
  },
  initialize: function(library) {
    console.log('initialize');
    return this.library = library;
  },
  push: function(view) {
    var el;
    this.views.push(view);
    console.log((function() {
      var _i, _len, _ref, _results;
      _ref = this.views;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        _results.push(view.href);
      }
      return _results;
    }).call(this));
    el = view.render().el;
    $(el).css('left', (this.views.length * COLUMN_WIDTH) + 'px');
    $(el).height(($('document')).height());
    return $('#content').append(el);
  },
  pushAt: function(depth, view) {
    var el;
    if (depth !== -1 && this.views.length > depth + 1) {
      el = view.render().el;
      $(el).css('left', (this.views.length * COLUMN_WIDTH) + 'px');
      $(el).height(($('document')).height());
      $(this.views[depth + 1].el).replaceWith(el);
      return this.views[depth + 1] = view;
    } else {
      return this.push(view);
    }
  },
  clearpush: function(view) {
    this.views = [];
    $('#content').empty();
    return this.push(view);
  },
  albums: function() {
    var _this = this;
    return (this.library.load('albums')).done(function(library) {
      console.log('albums');
      return _this.clearpush(new ColumnView({
        href: 'albums',
        subview: new CollectionView({
          itemView: AlbumView,
          model: library.albums
        })
      }));
    });
  },
  artists: function() {
    var _this = this;
    return (this.library.load('artists')).done(function(library) {
      return _this.clearpush(new ColumnView({
        href: 'artists',
        subview: new CollectionView({
          itemView: ArtistView,
          model: library.artists
        })
      }));
    });
  },
  labels: function() {
    var _this = this;
    return (this.library.load('albums')).done(function(library) {
      return library.albums.snapshot().always(function(snapshot, err) {
        var albums, i, label, length, offset;
        if (err) {
          return;
        }
        offset = snapshot.offset || 0;
        length = snapshot.length;
        albums = (function() {
          var _i, _ref, _results;
          _results = [];
          for (i = _i = offset, _ref = offset + length; _i < _ref; i = _i += 1) {
            _results.push(snapshot.get(i));
          }
          return _results;
        })();
        label = function(labels, album, callback) {
          return (album.load('label')).always(function(album, err) {
            if (!err && album.label) {
              if (!labels[album.label]) {
                labels[album.label] = [];
              }
              labels[album.label].push(album);
            }
            return callback(null, labels);
          });
        };
        window.labels = {};
        return async.reduce(albums, window.labels, label, function(err, labels) {
          return console.log('reduce?', labels);
        });
      });
    });
  },
  playlists: function() {
    var _this = this;
    return (this.library.load('playlists')).done(function(library) {
      console.log('playlists');
      return _this.clearpush(new ColumnView({
        href: 'playlists',
        subview: new CollectionView({
          itemView: PlaylistView,
          model: library.playlists
        })
      }));
    });
  },
  friends: function() {
    var _this = this;
    return (this.library.load('playlists')).always(function(library, err) {
      var snapshot;
      if (err) {
        return console.log('error', err);
      }
      snapshot = function(offset, length) {
        return {
          always: function(callback) {
            var _this = this;
            return library.playlists.snapshot(offset, length).always(function(snapshot, err) {
              var i, load, playlists, username;
              offset = snapshot.offset || 0;
              length = snapshot.length;
              playlists = (function() {
                var _i, _ref, _results;
                _results = [];
                for (i = _i = offset, _ref = offset + length; _i < _ref; i = _i += 1) {
                  _results.push(snapshot.get(i));
                }
                return _results;
              })();
              load = function(field) {
                return function(model, callback) {
                  return (model.load(field)).always(function(model, err) {
                    return callback(err, err ? void 0 : model[field]);
                  });
                };
              };
              username = function(_arg, playlist, callback) {
                var playlists, usernames;
                usernames = _arg.usernames, playlists = _arg.playlists;
                return async.waterfall([
                  function(callback) {
                    return (playlist.load('owner')).always(function(playlist, err) {
                      return callback(err, playlist.owner);
                    });
                  }, function(owner, callback) {
                    return (owner.load('username')).always(function(owner, err) {
                      return callback(err, owner);
                    });
                  }
                ], function(err, user) {
                  if (!playlists[user.username]) {
                    playlists[user.username] = [];
                  }
                  if (!usernames[user.username]) {
                    usernames[user.username] = [];
                  }
                  usernames[user.username].push(user);
                  playlists[user.username].push(playlist);
                  return callback(null, {
                    usernames: usernames,
                    playlists: playlists
                  });
                });
              };
              return async.reduce(_.compact(playlists), {
                usernames: {},
                playlists: {}
              }, username, function(err, _arg) {
                var playlists, spusers, user, usernames, users;
                users = _arg.usernames, playlists = _arg.playlists;
                window.users = users;
                window.userPlaylists = playlists;
                usernames = _.keys(users);
                user = function(username, callback) {
                  return callback(null, models.User.fromUsername(username));
                };
                return spusers = async.map(usernames, user, function(err, users) {
                  usernames = _.map(users, function(user) {
                    return user.username;
                  });
                  snapshot = {
                    range: {
                      offset: 0,
                      length: users.length
                    },
                    get: function(i) {
                      return users[i];
                    }
                  };
                  return callback(snapshot, err);
                });
              });
            });
          }
        };
      };
      return _this.clearpush(new ColumnView({
        href: 'friends',
        subview: new CollectionView({
          itemView: UserView,
          model: {
            snapshot: snapshot
          }
        })
      }));
    });
  },
  user: function(user, parentView) {
    var depth;
    parentView = parentView != null ? parentView.parentView : void 0;
    depth = this.views.indexOf(parentView);
    return this.pushAt(depth, new ColumnView({
      href: 'playlists',
      subview: new CollectionView({
        itemView: PlaylistView,
        model: {
          snapshot: function(offset, length) {
            return {
              always: function(callback) {
                var _ref;
                return callback({
                  range: {
                    offset: 0,
                    length: ((_ref = window.userPlaylists[user.username]) != null ? _ref.length : void 0) || 0
                  },
                  get: function(i) {
                    return window.userPlaylists[user.username][i];
                  }
                });
              }
            };
          }
        }
      })
    }));
  },
  fauxPlaylists: function() {
    var _this = this;
    return (this.library.load('playlists')).always(function(library, err) {
      var snapshot;
      if (err) {
        return console.log('error', err);
      }
      snapshot = function(offset, length) {
        return {
          always: function(callback) {
            var _this = this;
            return library.playlists.snapshot(offset, length).always(function(snapshot, err) {
              var i, isFauxAlbum, playlists;
              offset = snapshot.offset || 0;
              length = snapshot.length;
              playlists = (function() {
                var _i, _ref, _results;
                _results = [];
                for (i = _i = offset, _ref = offset + length; _i < _ref; i = _i += 1) {
                  _results.push(snapshot.get(i));
                }
                return _results;
              })();
              isFauxAlbum = function(playlist, callback) {
                var load;
                if (!playlist) {
                  return callback(false);
                }
                load = function(field) {
                  return function(model, callback) {
                    return (model.load(field)).always(function(model, err) {
                      return callback(err, err ? void 0 : model[field]);
                    });
                  };
                };
                return async.waterfall([
                  function(callback) {
                    return (playlist.load('tracks')).always(function(playlist, err) {
                      return callback(err, playlist);
                    });
                  }, function(playlist, callback) {
                    return playlist.tracks.snapshot().always(function(tracks, err) {
                      return callback(err, tracks);
                    });
                  }, function(tracks, callback) {
                    offset = tracks.offset || 0;
                    tracks = (function() {
                      var _i, _ref, _results;
                      _results = [];
                      for (i = _i = offset, _ref = offset + tracks.length; _i < _ref; i = _i += 1) {
                        _results.push(tracks.get(i));
                      }
                      return _results;
                    })();
                    return async.map(tracks, load('album'), callback);
                  }, function(albums, callback) {
                    return async.map(albums, load('uri'), callback);
                  }
                ], function(err, uris) {
                  var album;
                  album = !err && (_.uniq(uris)).length === 1;
                  return callback(album);
                });
              };
              return async.filter(playlists, isFauxAlbum, function(playlists) {
                return callback({
                  range: {
                    offset: offset,
                    length: Math.min(length, playlists.length)
                  },
                  get: function(i) {
                    return playlists[i];
                  }
                });
              });
            });
          }
        };
      };
      return _this.clearpush(new ColumnView({
        href: 'fauxPlaylists',
        subview: new CollectionView({
          itemView: FauxAlbumView,
          model: {
            snapshot: snapshot
          }
        })
      }));
    });
  },
  album: function(album, parentView) {
    var depth,
      _this = this;
    parentView = parentView != null ? parentView.parentView : void 0;
    depth = this.views.indexOf(parentView);
    return album.load('tracks').always(function(album, err) {
      if (err) {
        return console.log('error', err);
      }
      return _this.pushAt(depth, new ColumnView({
        href: album.uri,
        subview: new CollectionView({
          itemView: TrackView,
          model: album.tracks
        })
      }));
    });
  },
  artist: function(artist, parentView) {
    var depth,
      _this = this;
    console.log(artist);
    parentView = parentView.parentView;
    depth = this.views.indexOf(parentView);
    return artist.load('albums', 'image', 'name', 'uri').always(function(artist, err) {
      if (err) {
        return console.log('error', err);
      }
      return _this.pushAt(depth, new ArtistColumnView({
        href: artist.uri,
        subview: new CollectionView({
          itemView: AlbumView,
          model: artist.albums
        })
      }));
    });
  },
  playlist: function(playlist, parentView) {
    var depth,
      _this = this;
    parentView = parentView.parentView;
    depth = this.views.indexOf(parentView);
    return playlist.load('tracks', 'name', 'uri').always(function(playlist, err) {
      if (err) {
        return console.log('error', err);
      }
      return _this.pushAt(depth, new ColumnView({
        href: playlist.uri,
        subview: new CollectionView({
          itemView: TrackView,
          model: playlist.tracks
        })
      }));
    });
  },
  track: function(track, parentView) {
    return window.models.player.playTrack(track);
  }
});

require(['$api/library#Library', '$api/models', '$views/image#Image', '$views/list#List'], function(Library, models, Image, List) {
  var library;
  window.models = models;
  window.List = List;
  window.Image = Image;
  library = Library.forCurrentUser();
  (library.load('artists')).done(function(library) {
    return library.artists.snapshot(0).done(function(snapshot) {
      var artist, genreLoaded, i, length, offset, _i, _ref, _results;
      offset = snapshot.offset, length = snapshot.length;
      window.genres = [];
      genreLoaded = function(artist) {
        var x, _i, _len, _ref, _results;
        _ref = artist.genres;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(genres.push(x));
        }
        return _results;
      };
      _results = [];
      for (i = _i = offset, _ref = offset + length; _i < _ref; i = _i += 1) {
        artist = snapshot.get(i);
        if (!artist) {
          continue;
        }
        _results.push((artist.load('genres')).done(genreLoaded));
      }
      return _results;
    });
  });
  return (models.application.load('arguments')).done(function() {
    window.router = new AppRouter(library);
    Backbone.history.start({
      root: window.location.href
    });
    return ($('ul.column')).height($(document).height());
  });
});
