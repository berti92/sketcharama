var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var i18n = require('i18n');
var langArg = 'en';
var wordlistArg = 'wordlist_en.txt'//process.argv[3];
var portArg = 8001;
i18n.configure({
    locales:['en', 'de', 'zh'],
    directory: './locales',
    defaultLocale: langArg
});
var players = [];
var rooms = [];
var words = [];
var chat_colors = ['D0FA58','F5A9A9','F4FA58','A9F5F2','A9F5BC','CEE3F6','F6CEF5','F781F3','F2F2F2','F7819F','F3F781','58D3F7','D0F5A9','A9A9F5'];

String.prototype.startsWith = function (str)
                              {
                                 return this.indexOf(str) == 0;
                              }

fs.readFile(wordlistArg, 'utf8', function(err,data) {
    if(err) {
      return console.log(err);
    }
    data = data.split("\n");
    words = data.filter(function(n){ return n != undefined && n != ""});
});

//Create rooms for 3 players
for (i = 0; i < 10; i++) {
    create_room('3' + i.toString(), '', 3, '');
}
//Create rooms for 4 players
for (i = 0; i < 10; i++) {
    create_room('4' + i.toString(), '', 4, '');
}
//Create rooms for 6 players
for (i = 0; i < 10; i++) {
    create_room('6' + i.toString(), '', 6, '');
}
//Create rooms for 8 players
for (i = 0; i < 10; i++) {
    create_room('8' + i.toString(), '', 8, '');
}

function add_user(user, id) {
  var check = players.filter(function(value){ return value.id==id;});
  var username = user['name'];
  if(username === undefined || username === "" || username.toLowerCase() === "system") {
    username = "Player";
    username += Math.floor((Math.random() * 1000) + 1).toString();
  }
  if(check.length === 0) {
    players.push({ 'name': username.substring(0, 22).replace(/>/g,'').replace(/</g,'').replace(/javascript/g,'').replace(/&/g,''), 'id': id, 'clean_id': get_clean_id(), 'room_no': '', 'points': 0, 'votekick': [], 'color': ''});
  }
}

function get_color(room) {
  var room_colors = [];
  var cur_color = undefined;
  for (var i = 0; i < room['players'].length; i++) {
    room_colors.push(room['players'][i]['color']);
  }
  for (var i = 0; i < chat_colors.length; i++) {
    if(room_colors.indexOf(chat_colors[i]) === -1) {
      cur_color = chat_colors[i];
      break;
    }
  }
  if(cur_color === undefined) {
    chat_colors[Math.floor(Math.random() * chat_colors.length)]
  }
  return cur_color;
}

function get_clean_id() {
  var clean_ids = [];
  for (var i = 0; i < players.length; i++) {
    clean_ids.push(players[i]['clean_id']);
  }
  var clean_id = Math.floor((Math.random() * 10000000) + 1);
  while(clean_ids.indexOf(clean_id) > -1) {
    clean_id = Math.floor((Math.random() * 10000000) + 1);
  }
  return clean_id;
}


function disconnect_user(id, delete_from_public_player_array) {
  for (var i = 0; i < rooms.length; i++) {
    var current_room = rooms[i];
    var player = current_room['players'].filter(function(value){ return value.id==id;});
    if(player[0] !== undefined) {
      var index_player = current_room['players'].indexOf(player[0]);
      if(index_player !== -1) {
        current_room['players'].splice(index_player,1);
        if(current_room['round']['drawer_id'] === id) {
          start_new_round(current_room['name']);
        }
        if(current_room['players'].length === 0) {
          if(current_room['password'] !== '' && current_room['password'] !== undefined) {
            var priv_room = find_room_from_name(current_room['name']);
            var priv_room_index = rooms.indexOf(priv_room);
            if(priv_room_index !== -1) {
              rooms.splice(priv_room_index,1);
            }
          } else {
            current_room['round'] = {'word':'', 'word_crypt':'', 'round_no': 0, 'finished': [], 'drawer_id': '', 'drawed': [], 'time_left': 0};
          }
        }
        if(io.sockets.connected[id] !== undefined) {
          io.sockets.connected[id].leave(current_room['name']);
        }
        io.sockets.in(current_room['name']).emit('reload_players', get_players(current_room['name']));
      }
    }
  }
  if(delete_from_public_player_array === true) {
    var player = find_player_from_socket_id(id);
    var player_index = players.indexOf(player);
    if(player_index !== -1) {
      players.splice(player_index,1);
    }
  }
}

function get_rooms() {
  var public_room_array = [];
  for (var i = 0; i < rooms.length; i++) {
    var current_room = rooms[i];
    if(current_room['max-players'] !== current_room['players'].length) {
      public_room_array.push({'name':current_room['name'], 'password': (current_room['password'] !== ""), 'max-players': current_room['max-players'], 'player-count': current_room['players'].length});
    }
  }
  return public_room_array;
}

function get_room() {
  var public_room_array = [];
  for (var i = 0; i < rooms.length; i++) {
    var current_room = rooms[i];
    if(current_room['max-players'] !== current_room['players'].length) {
      public_room_array.push({'name':current_room['name'], 'password': (current_room['password'] !== ""), 'max-players': current_room['max-players'], 'player-count': current_room['players'].length});
    }
  }
  return public_room_array;
}

function get_random_word(words_ar) {
  if(words_ar.length > 0) {
    return words_ar[Math.floor((Math.random() * words_ar.length))].toUpperCase();
  } else {
    return words[Math.floor((Math.random() * words.length) + 1)].toUpperCase();
  }
}

function blank_word_length(length) {
  var ret_str = "";
  for (i = 0; i < length; i++) {
    ret_str += "_ ";
  }
  return ret_str;
}

function get_players(room_no) {
  var room = rooms.filter(function(value){ return value.name==room_no.toString();})[0];
  var player_arr = [];
  var position = 1;
  if(room !== undefined) {
    for (i = 0; i < room['players'].length; i++) {
      var cur_player = room['players'].sort(function(a, b) { return parseInt(b.points) - parseInt(a.points);})[i];
      player_arr.push({'clean_id': cur_player['clean_id'], 'name': cur_player['name'], 'points': cur_player['points'], 'position': position, 'drawer': (room['round']['drawer_id'] === cur_player['id']), 'finished': (room['round']['finished'].indexOf(cur_player['id']) > -1)});
      position += 1;
    }
  }
  return player_arr;
}

function select_drawer(room) {
  var player_ids = [];
  for (i = 0; i < room['players'].length; i++) {
    player_ids.push(room['players'][i]['id']);
  }
  for (i = 0; i < room['round']['drawed'].length; i++) {
    var index = player_ids.indexOf(room['round']['drawed'][i]);
    if(index !== -1) {
      player_ids.splice(index,1);
    }
  }
  return player_ids[(Math.floor((Math.random() * player_ids.length) + 1) - 1)]
}

function start_new_round(room_no) {
  var room = find_room_from_name(room_no);
  if(room['round']['drawed'].length === 0 || room['round']['drawed'].length === room['players'].length || room['round']['round_no'] === 0) {
    room['round']['drawed'] = [];
    if(room['round']['round_no'] === 3) {
      room['round']['round_no'] = 1;
      var player_ar = get_players(room['name']);
      io.sockets.in(room['name']).emit('chat_income', {'player-name': 'SYSTEM', 'message': i18n.__('Game over, the next game begins shortly!')});
      for (i = 0; i < player_ar.length; i++) {
        var name_with_color = get_playername_with_color_from_clean_id(player_ar[i]['clean_id']);
        io.sockets.in(room['name']).emit('chat_income', {'player-name': 'SYSTEM', 'message': i18n.__('stats',player_ar[i]['position'],name_with_color)});
      }
      for (i = 0; i < room['players'].length; i++) {
        room['players'][i]['points'] = 0;
      }
    } else {
      room['round']['round_no'] += 1;
    }
  }
  room['round']['finished'] = [];
  if(room['round']['word'] !== '') {
    io.sockets.in(room_no).emit('chat_income', {'player-name':'SYSTEM', 'message': i18n.__('The word of the round was %s.',room['round']['word'])});
  }
  room['round']['word'] = get_random_word(room['words']);
  room['round']['word_crypt'] = blank_word_length(room['round']['word'].length);
  //select drawer
  room['round']['drawer_id'] = select_drawer(room);
  room['round']['id'] = room['round']['drawer_id'] + room['round']['round_no'];
  room['round']['drawed'].push(room['round']['drawer_id']);
  for (i = 0; i < room['players'].length; i++) {
    if(room['players'][i]['id'] === room['round']['drawer_id']) {
      io.to(room['round']['drawer_id']).emit('start_new_round_with_draw', {'word': room['round']['word'], 'round': room['round']['round_no'], 'id': room['round']['id']});
      var name_with_color = get_playername_with_color(room['players'][i]['id']);
      io.sockets.in(room['name']).emit('chat_income', {'player-name': 'SYSTEM', 'message': i18n.__('%s is drawing!',name_with_color)});
    } else {
      io.to(room['players'][i]['id']).emit('start_new_round', {'word': room['round']['word_crypt'], 'round': room['round']['round_no'], 'id': room['round']['id']});
    }
  }
  io.sockets.in(room_no).emit('reload_players', get_players(room_no));
}

function init_room(room_no, socket_id) {
  var player = find_player_from_socket_id(socket_id);
  var room = find_room_from_name(room_no);
  //currently playing
  //if yes get timer and canvas
  if(room['round']['round_no'] > 0) {
    io.to(room['round']['drawer_id']).emit('send_full_pic', socket_id);
  } else {
    //if not start a round
    start_new_round(room_no);
  }
}

function guess(socket_id, room, word) {
  var player = find_player_in_room_by_socket_id(room, socket_id);
  var draw_player = find_player_in_room_by_socket_id(room, room['round']['drawer_id']);
  if(room !== undefined && room['round']['word'] === word && socket_id !== room['round']['drawer_id'] && room['round']['finished'].indexOf(socket_id) === -1) {
    var cur_points = room['round']['time_left'];
    if(cur_points > 60) {
      cur_points = 60;
    }
    player['points'] += cur_points;
    if(draw_player !== undefined) {
      draw_player['points'] += 5;
    }
    room['round']['finished'].push(socket_id);
    io.sockets.in(player['room_no']).emit('reload_players', get_players(player['room_no']));
    if(cur_points > 0) {
      io.to(socket_id).emit('guessed_right', {'word': room['round']['word'], 'points': cur_points});
    }
    if(room['round']['finished'].length === 1 && room['round']['time_left'] > 30) {
      room['round']['time_left'] = 30;
      io.sockets.in(player['room_no']).emit('get_new_time', 30);
    }
    if(room['round']['finished'].length === (room['players'].length - 1)) {
      start_new_round(player['room_no']);
    }
    return true
  } else {
    if(room !== undefined && room['round']['word'] === word) {
      return true
    } else {
      return false
    }
  }
}

function kick_leaved_players_from_rooms(socket_id) {
  disconnect_user(socket_id, false);
}

function get_all_room_names() {
  var room_name_arr = [];
  for (i = 0; i < rooms.length; i++) {
    room_name_arr.push(rooms[i]['name']);
  }
  return room_name_arr;
}

function create_private_room(pass, words) {
  var room_no = Math.floor((Math.random() * 10000) + 1);
  var room_names = get_all_room_names();
  while (room_names.indexOf(room_no) > -1) {
    room_no = Math.floor((Math.random() * 10000) + 1);
  }
  return create_room(room_no, pass, 100, words);
}

function create_room(room_no, pass, max_players, words) {
  if(words != "" && words.split("\n").length > 0) {
    words = words.split("\n");
    words_ar = words.filter(function(n){ return n != undefined && n != ""});
  } else {
    words_ar = [];
  }
  var room = {'words': words_ar, 'max-players': max_players, 'name': room_no.toString(), 'password': pass, 'players': [], 'round': { 'id': '', 'word':'', 'word_crypt':'', 'round_no': 0, 'finished': [], 'drawer_id': '', 'drawed': [], 'time_left': 0}};
  rooms.push(room);
  return room;
}

function max_tips(room) {
  var time_left = room['round']['time_left'];
  var word = room['round']['word'];
  var crypted_word = room['round']['word_crypt'];
  var def_tips = {};
  var max_tips = 0;
  if(word.length >= 20) {
    def_tips = {1: 10, 2: 8, 3: 5, 4: 2};
  } else if(word.length >= 10) {
    def_tips = {1: 8, 2: 6, 3: 4, 4: 2};
  } else if(word.length >= 5) {
    def_tips = {1: 3, 2: 3, 3: 2, 4: 1};
  } else if(word.length >= 3) {
    def_tips = {1: 2, 2: 1, 3: 1, 4: 1};
  }
  if(time_left === 80) {
    max_tips = def_tips[4];
  } else if(time_left === 60) {
    max_tips = def_tips[3];
  } else if(time_left === 30) {
    max_tips = def_tips[2];
  } else if(time_left === 10) {
    max_tips = def_tips[1];
  }
  crypted_word = reveal_character(word, crypted_word, max_tips);
  room['round']['word_crypt'] = crypted_word;
  for (i = 0; i < room['players'].length; i++) {
    if(room['players'][i]['id'] !== room['round']['drawer_id'] && room['round']['finished'].indexOf(room['players'][i]['id']) === -1) {
      io.to(room['players'][i]['id']).emit('get_new_word', crypted_word);
    }
  }
}

function reveal_character(word, crypted_word, max_tips) {
  crypted_word = crypted_word.replace(/ /g,'');
  while((word.length - (crypted_word.match(/_/g) || []).length) < max_tips) {
    var pos = Math.floor(Math.random() * word.length);
    var tip = word.charAt(pos);
    crypted_word = replaceAt(crypted_word, pos, tip);
  }
  return crypted_word.split('').join(' ');
}

// replace the 'n'th character of 's' with 't'
function replaceAt(s, n, t) {
  return s.substring(0, n) + t + s.substring(n + 1);
}

function find_player_from_socket_id(sid) {
 return players.filter(function(value){ return value.id==sid;})[0];
}
function find_player_from_clean_id(sid) {
 return players.filter(function(value){ return value.clean_id==sid;})[0];
}
function find_player_in_room_by_socket_id(room, sid) {
  return room['players'].filter(function(value){ return value.id==sid;})[0];
}
function find_player_in_room_by_clean_id(room, cid) {
  return room['players'].filter(function(value){ return value.clean_id==cid;})[0];
}

function get_playername_with_color(sid) {
  player = find_player_from_socket_id(sid);
  return '<span style="color:#'+player['color']+'">'+player['name']+'</span>'
}

function get_playername_with_color_from_clean_id(sid) {
  player = find_player_from_clean_id(sid);
  return '<span style="color:#'+player['color']+'">'+player['name']+'</span>'
}

function find_room_from_socket_id(sid) {
  var player = find_player_from_socket_id(sid);
  var room = rooms.filter(function(value){ return value.name==player['room_no'].toString();})[0];
  return room
}

function find_room_from_player(player) {
  var room = rooms.filter(function(value){ return value.name==player['room_no'].toString();})[0];
  return room
}

function find_room_from_name(room_name) {
  var room = rooms.filter(function(value){ return value.name==room_name.toString();})[0];
  return room
}

function admin_things(sid, room, msg) {
  var player = find_player_from_socket_id(sid);
  var msg = msg.toString();
  if(msg.startsWith("###CONSOLE###SEND_TO_ALL###SECRETKEY###")) {
    var priv_msg = msg.replace("###CONSOLE###SEND_TO_ALL###SECRETKEY###","");
    io.emit('chat_income', {'player-name': 'SYSTEM', 'message': priv_msg});
    return true;
  } else {
    return false;
  }
}

io.on('connection', function(socket) {
  var clientIp = socket.request.connection.remoteAddress;
  socket.on('username', function(msg) {
    add_user(msg, socket.id);
    console.log('New connection from ' + msg + ' ' + clientIp + ' Time: ' + Date());
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
    disconnect_user(socket.id, true);
  });
  socket.on('get_rooms', function(msg) {
    socket.emit('rooms', get_rooms());
  });
  socket.on('get_players', function(msg) {
    console.log(get_players(msg));
    socket.emit('rooms', get_players(msg));
  });
  socket.on('chat_message', function(msg) {
    var player = find_player_from_socket_id(socket.id);
    var room = find_room_from_socket_id(socket.id);
    if(room !== undefined) {
      var drawer = room['round']['drawer_id'];
    } else {
      var drawer = undefined;
    }
    msg = msg.substring(0, 256).replace(/>/g,'').replace(/</g,'').replace(/javascript/g,'').replace(/&/g,'');
    if(room !== undefined && player !== undefined && msg !== null && msg !== "" && guess(socket.id, room, msg.toUpperCase()) === false && admin_things(socket.id, room, msg) === false && drawer !== socket.id) {
      if(msg.length > 0) {
        io.sockets.in(player['room_no']).emit('chat_income', {'player-name':player['name'], 'message': msg, 'color': player['color']});
      }
    } else if(drawer === socket.id) {
      socket.emit('chat_income', {'player-name':'SYSTEM', 'message': i18n.__('The drawer is not allowed to chat!')});
    }
  });
  socket.on('send_brush', function(msg) {
    var player = find_player_from_socket_id(socket.id);
    var room = find_room_from_player(player);
    if(room !== undefined && room['round']['drawer_id'] === socket.id && player !== undefined) {
      socket.broadcast.to(player['room_no']).emit('incoming_draw', msg);
    }
  });
  socket.on('init_area', function(msg) {
    var player = find_player_from_socket_id(socket.id);
    var room = find_room_from_player(player);
    if(room !== undefined && room['round']['drawer_id'] === socket.id && player !== undefined) {
      socket.broadcast.to(player['room_no']).emit('scale_area', msg);
    }
  });
  socket.on('send_clear_area', function(msg) {
    var player = find_player_from_socket_id(socket.id);
    var room = find_room_from_player(player);
    if(room !== undefined && room['round']['drawer_id'] === socket.id && player !== undefined) {
      socket.broadcast.to(player['room_no']).emit('incoming_clear_area', msg);
    }
  });
  socket.on('join_room', function(msg) {
    kick_leaved_players_from_rooms(socket.id);
    var player = find_player_from_socket_id(socket.id);
    var room = find_room_from_name(msg);
    if(room !== undefined && player !== undefined && room['max-players'] > room['players'].length && room['password'] === '') {
      socket.join(msg);
      var old_user = find_player_in_room_by_socket_id(room, socket.id);
      if(old_user === undefined) {
        player['votekick'] = [];
        player['color'] = get_color(room);
        room['players'].push(player);
        player['room_no'] = msg;
        socket.emit('join_success', msg);
        io.sockets.in(msg).emit('reload_players', get_players(msg));
        if(room['players'].length === 2) {
          room['round'] = { 'id': '', 'word':'', 'word_crypt':'', 'round_no': 0, 'finished': [], 'drawer_id': '', 'drawed': [], 'time_left': 0};
        }
        if(room['players'].length > 1) {
          init_room(player['room_no'], socket.id);
        } else {
          socket.emit('wait_for_player', '1');
        }
      }
    } else {
      if(room['password'] !== '') {
        socket.emit('join_password_needed', msg);
      } else {
        socket.emit('join_failed', 'true');
      }
    }
  });
  socket.on('join_private_room', function(msg) {
    kick_leaved_players_from_rooms(socket.id);
    var player = find_player_from_socket_id(socket.id);
    var room = find_room_from_name(msg['room_no']);
    if(room !== undefined && player !== undefined && room['max-players'] > room['players'].length && room['password'] === msg['password']) {
      socket.join(msg['room_no']);
      var old_user = find_player_from_socket_id(socket.id);
      if(old_user === undefined) {
        player['votekick'] = [];
        player['color'] = get_color(room);
        room['players'].push(player);
        player['room_no'] = room['name'];
        socket.emit('join_success', msg['room_no']);
        io.sockets.in(msg).emit('reload_players', get_players(room['name']));
        if(room['players'].length === 2) {
          room['round'] = { 'id': '', 'word':'', 'word_crypt':'', 'round_no': 0, 'finished': [], 'drawer_id': '', 'drawed': [], 'time_left': 0};
        }
        if(room['players'].length > 1) {
          init_room(player['room_no'], socket.id);
        } else {
          socket.emit('wait_for_player', '1');
        }
      }
    } else {
      socket.emit('join_failed_password', 'true');
    }
  });
  socket.on('create_and_join_private_room', function(msg) {
    var player = find_player_from_socket_id(socket.id);
    var room = create_private_room(msg['password'], msg['words']);
    if(room !== undefined && player !== undefined && room['max-players'] > room['players'].length) {
      socket.join(room['name']);
      player['votekick'] = [];
      player['color'] = get_color(room);
      room['players'].push(player);
      player['room_no'] = room['name'];
      socket.emit('join_success', room['name']);
      io.sockets.in(room['name']).emit('reload_players', get_players(room['name']));
      if(room['players'].length > 1) {
        init_room(player['room_no'], socket.id);
      } else {
        socket.emit('wait_for_player', '1');
      }
    } else {
      socket.emit('join_failed', 'true');
    }
  });
  socket.on('draw_end', function(msg) {
    var player = find_player_from_socket_id(socket.id);
    var room = find_room_from_name(player['room_no']);
    if(room !== undefined && room['players'].length > 1) {
      if(room['round']['drawer_id'] === socket.id && room['round']['id'] === msg) {
        start_new_round(player['room_no']);
      }
    } else {
      socket.emit('wait_for_player', '1');
    }
  });
  socket.on('skip_turn', function(msg) {
    var player = find_player_from_socket_id(socket.id);
    var namec = get_playername_with_color(socket.id);
    var room = find_room_from_name(player['room_no']);
    if(room !== undefined && room['players'].length > 1) {
      if(room['round']['drawer_id'] === socket.id) {
        io.sockets.in(room['name']).emit('chat_income', {'player-name': 'SYSTEM', 'message': i18n.__('%s skipped the round!',namec)});
        start_new_round(player['room_no']);
      }
    } else {
      socket.emit('wait_for_player', '1');
    }
  });
  socket.on('im_alive', function(msg) {
    var player = find_player_from_socket_id(socket.id);
    var room = find_room_from_name(player['room_no']);
    if(room !== undefined) {
      room['round']['time_left'] = parseInt(msg);
      max_tips(room);
    }
  });
  socket.on('pass_full_pic', function(msg) {
    var player = find_player_from_socket_id(socket.id);
    var room = find_room_from_name(player['room_no']);
    io.to(msg['id']).emit('get_full_pic', {'data': msg['url'], 'time': room['round']['time_left']});
  });
  socket.on('kick_player', function(msg) {
    var room = find_room_from_socket_id(socket.id);
    var vote_player = find_player_in_room_by_socket_id(room, socket.id);
    var votecname = get_playername_with_color(socket.id);
    var kick_player = find_player_in_room_by_clean_id(room, msg);
    var kickcname = get_playername_with_color_from_clean_id(msg);
    if(kick_player['id'] !== socket.id && kick_player['votekick'].indexOf(socket.id) === -1) {
      kick_player['votekick'].push(socket.id);
      var one_perc = 100 / room['players'].length;
      var fin_perc = one_perc * kick_player['votekick'].length;
      io.sockets.in(room['name']).emit('chat_income', {'player-name': 'SYSTEM', 'message': i18n.__('%s will kick the player %s.',votecname,kickcname)});
      if(fin_perc >= 60) {
        disconnect_user(kick_player['id'], false);
        io.to(kick_player['id']).emit('was_kicked', 1);
        io.sockets.in(room['name']).emit('chat_income', {'player-name': 'SYSTEM', 'message': i18n.__('The player %s was kicked.',kickcname)});
      }
    }
  });
});

http.listen(parseInt(portArg), function() {
  console.log('listening on *:'+portArg);
});
