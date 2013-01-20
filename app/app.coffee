$ = Backbone.$ unless $

# COLUMN_WIDTH = 234
COLUMN_WIDTH = 300

IMAGE_SIZE = 48


MediaView = Backbone.View.extend
  tagName: 'tr'

  className: 'sp-list-item'

  template: _.template ($ '#table-list-item-template').html()

  events:
    click: 'click'

  initialize: (options) ->
    @parentView = options?.parentView
    @model = options?.model

  render: () ->
    @$el.html @template()

    if @model
      @load @model, (model) =>
        @$('.sp-list-cell-image').append (@image model).node
        @$('.sp-list-cell-track').text (@text model)

    @

  click: () ->
    @parentView.click @
    @route @model, @parentView


AlbumView = MediaView.extend
  load: (model, callback) -> (model.load 'name').always (model, err) -> console.log err if err; callback model unless err
  image: (album) -> Image.forAlbum album,
    width: IMAGE_SIZE
    height: IMAGE_SIZE
    style: 'plain'
    animate: false
  text: (album) -> album.name
  route: (album, parentView) -> router.album album, parentView
  render: () ->
    @$el.html @template()

    if @model
      @$('.sp-list-cell-image').append (@image @model).node
      title = @model.name
      artists = (_.map @model.artists, (artist) -> artist.name).join ', '
      view = new DoubleLineTextView
        primaryText: title
        secondaryText: artists
      (view.setElement (@$ '.sp-list-cell-track')).render()

    @


AlbumGroupView = AlbumView.extend
  initialize: (options) ->
    @parentView = options?.parentView
    @model = options?.model

    if @model and _.has @model, 'albums'
      @model = @model.albums[0]


PlaylistAlbumView = AlbumView.extend
  image: (playlist) -> Image.forPlaylist playlist,
    width: IMAGE_SIZE
    height: IMAGE_SIZE
    style: 'plain'
    animate: false
  route: (playlist, parentView) -> router.playlist playlist, parentView
  render: () ->
    @$el.html @template()

    if @model
      async.waterfall [
        do (model = @model) -> (callback) -> (model.load 'tracks').always (model, err) -> callback err, model.tracks
        (tracks, callback) -> tracks.snapshot(0, 1).always (tracks, err) -> callback err, tracks
        (tracks, callback) ->
          track = tracks.get 0
          (track.load 'artists', 'album').always (track, err) -> callback err, track
        (track, callback) ->
          f =
            artists: do (artists = track.artists) -> (callback) ->
              name = (artist, callback) -> (artist.load 'name').always (artist, err) -> callback err, artist
              async.map artists, name, callback
            album: do (album = track.album) -> (callback) -> (album.load 'name').always (album, err) -> callback err, album

          async.parallel f, callback
      ], (err, {artists, album}) =>
        if err
          return (@$ '.sp-list-cell-track').text err if err

        artists = (_.map artists, (artist) -> artist.name).join ', '
        album = album.name
        view = new DoubleLineTextView
          primaryText: album
          secondaryText: artists
        (view.setElement (@$ '.sp-list-cell-track')).render()
        (@$ '.sp-list-cell-image').append (@image @model).node


    @


ArtistView = MediaView.extend
  load: (model, callback) -> (model.load 'name').always (model, err) -> callback model unless err
  image: (artist) -> Image.forArtist artist,
    width: IMAGE_SIZE
    height: IMAGE_SIZE
    style: 'plain'
    animate: false
  text: (artist) -> artist.name
  route: (artist, parentView) -> router.artist artist, parentView


TrackView = MediaView.extend
  load: (model, callback) -> (model.load 'name', 'artists').always (model, err) -> callback model unless err
  image: (track) -> node: null
  text: (track) -> track.name
  route: (track, parentView) -> router.track track, parentView
  render: () ->
    @$el.html @template()

    if @model
      @load @model, (model) =>
        @$('.sp-list-cell-image').append (@image @model).node
        view = new DoubleLineTextView
          primaryText: @model.name
          secondaryText: (_.map @model.artists, (artist) -> artist.name).join ', '
        (view.setElement (@$ '.sp-list-cell-track')).render()

    @


PlaylistView = MediaView.extend
  load: (model, callback) -> (model.load 'name').always (model, err) -> callback model unless err
  image: (playlist) -> Image.forPlaylist playlist,
      width: IMAGE_SIZE
      height: IMAGE_SIZE
      style: 'plain'
      animate: false
  text: (playlist) -> playlist.name
  route: (playlist, parentView) -> router.playlist playlist, parentView


UserView = MediaView.extend
  load: (model, callback) -> callback model
  image: (user) -> Image.forUser user,
    width: IMAGE_SIZE
    height: IMAGE_SIZE
    style: 'plain'
    animate: false
  text: (user) -> user.username
  route: (user, parentView) -> router.user user, parentView


DoubleLineTextView = Backbone.View.extend
  template: _.template ($ '#text-template').html()

  initialize: (options) ->
    {@primaryText, @secondaryText, @model} = options

  render: () ->
    @$el.html @template
      primary: @primaryText
      secondary: @secondaryText


CollectionView = Backbone.View.extend
  tagName: 'tbody'

  className: 'sp-list-table-body'

  offset: 0

  length: 30

  isLoading: false

  events:
    scroll: 'scroll'

  initialize: (options) ->
    {@itemView, @model} = options

  render: () ->
    return this unless @model
    do @fetch
    @

  fetch: () ->
    p = @model.snapshot(@offset, 150)
    p.always (snapshot, err) =>
      return console.log 'error at fetch', err if err
      {offset, length} = snapshot.range
      length = Math.min length, 150

      for i in [offset...offset + length] by 1 then do (i) =>
        view = new @itemView
          model: snapshot.get i
          parentView: @
        @$el.append view.render().el

  scroll: () ->
    if @el.scrollTop + @el.clientHeight + 10 > @el.scrollHeight
      @offset += @length
      do @fetch

  click: (view) ->
    @selectedView?.$el.css background: '#ECEBE8'
    view.$el.css background: '#d0d0d0'
    @selectedView = view


ColumnView = Backbone.View.extend
  tagName: 'div'

  className: 'sp-list sp-list-fixed-height sp-list-layout-toplist column'

  template: _.template ($ '#table-list-template').html()

  initialize: (options) ->
    {@subview, @depth, @href} = options
    @subview.parentView = this

  render: () ->
    {$el, template} = @
    $el.html template()
    (@subview.setElement (@$ '.sp-list-table-body')).render()
    $el.height ($ 'document').height()
    @


ArtistColumnView = ColumnView.extend
  template: _.template ($ '#table-list-artist-template').html()

  render: () ->
    {$el, template} = @
    $el.html template()
    (@subview.setElement (@$ '.sp-list-table-body')).render()
    $el.height ($ 'document').height()
    @


AppRouter = Backbone.Router.extend
  views: [],

  columns: [],

  routes:
    playlists: 'playlists'
    fauxPlaylists: 'fauxPlaylists'
    albums: 'albums'
    artists: 'artists'
    labels: 'labels'
    friends: 'friends'

  initialize: (library) ->
    console.log 'initialize'
    @library = library

  push: (view) ->
    @views.push(view)
    console.log (view.href for view in @views)
    el = view.render().el
    $(el).css 'left', (@views.length * COLUMN_WIDTH) + 'px'
    $(el).height ($ 'document').height()
    $('#content').append(el)

  pushAt: (depth, view) ->
    if depth != -1 and @views.length > depth + 1
      el = view.render().el
      $(el).css 'left', (@views.length * COLUMN_WIDTH) + 'px'
      $(el).height ($ 'document').height()
      $(@views[depth + 1].el).replaceWith el
      @views[depth + 1] = view
    else
      @push view

  clearpush: (view) ->
    this.views = []
    $('#content').empty()
    this.push(view)

  albums: () ->
    (@library.load 'albums').done (library) =>
      console.log 'albums'
      @clearpush new ColumnView
        href: 'albums'
        subview: new CollectionView
          itemView: AlbumView
          model: library.albums

  artists: () ->
    (@library.load 'artists').done (library) =>
      @clearpush new ColumnView
        href: 'artists'
        subview: new CollectionView
          itemView: ArtistView
          model: library.artists

  labels: () ->
    (@library.load 'albums').done (library) =>
      library.albums.snapshot().always (snapshot, err) ->
        return if err

        offset = snapshot.offset or 0
        length = snapshot.length
        albums = (snapshot.get i for i in [offset...offset + length] by 1)
        label = (labels, album, callback) ->
          (album.load 'label').always (album, err) ->
            if !err and album.label
              unless labels[album.label]
                labels[album.label] = []

              labels[album.label].push album

            callback null, labels

        window.labels = {}
        async.reduce albums, window.labels, label, (err, labels) ->
          console.log 'reduce?', labels

  playlists: () ->
    (@library.load 'playlists').done (library) =>
      console.log 'playlists'
      @clearpush new ColumnView
        href: 'playlists'
        subview: new CollectionView
          itemView: PlaylistView
          model: library.playlists

  friends: () ->
    (@library.load 'playlists').always (library, err) =>
      return console.log 'error', err if err
      snapshot = (offset, length) ->
        always: (callback) ->
          library.playlists.snapshot(offset, length).always (snapshot, err) =>
            offset = snapshot.offset or 0
            length = snapshot.length
            playlists = (snapshot.get i for i in [offset...offset + length] by 1)
            load = (field) -> (model, callback) ->
              (model.load field).always (model, err) ->
                callback err, if err then undefined else model[field]

            username = ({usernames, playlists}, playlist, callback) ->
              async.waterfall [
                (callback) -> (playlist.load 'owner').always (playlist, err) -> callback err, playlist.owner
                (owner, callback) -> (owner.load 'username').always (owner, err) -> callback err, owner
              ], (err, user) ->
                unless playlists[user.username]
                  playlists[user.username] = []

                unless usernames[user.username]
                  usernames[user.username] = []

                usernames[user.username].push user
                playlists[user.username].push playlist
                callback null,
                  usernames: usernames
                  playlists: playlists

            async.reduce (_.compact playlists), {usernames: {}, playlists: {}}, username, (err, {usernames:users, playlists:playlists}) ->
              window.users = users
              window.userPlaylists = playlists
              usernames = _.keys users
              user = (username, callback) -> callback null, (models.User.fromUsername username) # .always (user, err) -> callback err, user
              spusers = async.map usernames, user, (err, users) ->
                usernames = _.map users, (user) -> user.username
                snapshot =
                  range:
                    offset: 0
                    length: users.length
                  get: (i) -> users[i]
                callback snapshot, err

      @clearpush new ColumnView
        href: 'friends'
        subview: new CollectionView
          itemView: UserView
          model:
            snapshot: snapshot

  user: (user, parentView) ->
    parentView = parentView?.parentView
    depth = @views.indexOf parentView

    @pushAt depth, new ColumnView
      href: 'playlists'
      subview: new CollectionView
        itemView: PlaylistView
        model:
          snapshot: (offset, length) ->
            return {
              always: (callback) ->
                callback {
                  range:
                    offset: 0
                    length: window.userPlaylists[user.username]?.length or 0
                  get: (i) -> window.userPlaylists[user.username][i]
                }
            }

  fauxPlaylists: () ->
    (@library.load 'playlists').always (library, err) =>
      return console.log 'error', err if err
      snapshot = (offset, length) ->
        always: (callback) ->
          library.playlists.snapshot(offset, length).always (snapshot, err) =>
            offset = snapshot.offset or 0
            length = snapshot.length
            playlists = (snapshot.get i for i in [offset...offset + length] by 1)
            isPlaylistAlbum = (playlist, callback) ->
              return callback false unless playlist

              load = (field) -> (model, callback) ->
                (model.load field).always (model, err) ->
                  callback err, if err then undefined else model[field]

              async.waterfall [
                (callback) -> (playlist.load 'tracks').always (playlist, err) -> callback err, playlist
                (playlist, callback) -> playlist.tracks.snapshot().always (tracks, err) -> callback err, tracks
                (tracks, callback) ->
                  offset = tracks.offset or 0
                  tracks = (tracks.get i for i in [offset...offset + tracks.length] by 1)
                  async.map tracks, (load 'album'), callback
                (albums, callback) ->
                  async.map albums, (load 'uri'), callback
              ], (err, uris) ->
                album = !err and (_.uniq uris).length == 1
                callback album

            async.filter playlists, isPlaylistAlbum, (playlists) -> callback
              range:
                offset: offset
                length: Math.min length, playlists.length
              get: (i) -> playlists[i]

      @clearpush new ColumnView
        href: 'fauxPlaylists'
        subview: new CollectionView
          itemView: PlaylistAlbumView
          model:
            snapshot: snapshot

  album: (album, parentView) ->
    parentView = parentView?.parentView
    depth = @views.indexOf parentView

    album.load('tracks').always (album, err) =>
      return console.log 'error', err if err
      @pushAt depth, new ColumnView
        href: album.uri
        subview: new CollectionView
          itemView: TrackView
          model: album.tracks

  artist: (artist, parentView) ->
    console.log artist
    parentView = parentView.parentView
    depth = @views.indexOf parentView
    # albums+singles, genres,
    artist.load('albums', 'image', 'name', 'uri').always (artist, err) =>
      return console.log 'error', err if err
      @pushAt depth, new ArtistColumnView
        href: artist.uri
        subview: new CollectionView
          itemView: AlbumView
          model: artist.albums

  playlist: (playlist, parentView) ->
    parentView = parentView.parentView
    depth = @views.indexOf parentView

    playlist.load('tracks', 'name', 'uri').always (playlist, err) =>
      return console.log 'error', err if err
      @pushAt depth, new ColumnView
        href: playlist.uri
        subview: new CollectionView
          itemView: TrackView
          model: playlist.tracks

  track: (track, parentView) ->
    window.models.player.playTrack track


require [
  '$api/library#Library'
  '$api/models'
  '$views/image#Image'
  '$views/list#List'
], (Library, models, Image, List) ->
  window.models = models
  window.List = List
  window.Image = Image

  library = Library.forCurrentUser()

  (library.load 'artists').done (library) ->
    library.artists.snapshot(0).done (snapshot) ->
      {offset, length} = snapshot

      window.genres = []

      genreLoaded = (artist) -> genres.push x for x in artist.genres

      for i in [offset...offset + length] by 1
        artist = snapshot.get i
        continue unless artist
        (artist.load 'genres').done genreLoaded

  (models.application.load 'arguments').done ->
    window.router = new AppRouter library
    Backbone.history.start root: window.location.href
    ($ 'ul.column').height $(document).height()
