var socket = null;
var is_drawer = false;
/* for painting */
var mousePressed = false;
var lastX, lastY;
var ctx;
var current_time;
var timer_interval_id;
var pencil_icon = '<i class="fa fa-pencil fa-1" aria-hidden="true"></i>';
var finished_icon = '<i class="fa fa-thumbs-up fa-1" aria-hidden="true"></i>';
var password_icon = '<i class="fa fa-lock fa-1" aria-hidden="true"></i>';
var sketchHost = location.protocol + "//" + location.hostname + ":8001";

$(function() {
	socket = io(sketchHost);
	initChatHeight();
	submit_username(username);
	if(password !== "") {
		submit_password(password, words);
	} else {
		join_room(room);
	}
	socket.on('join_success', function(msg){
    room = msg;
    $('#span_room').html(room);
		$('.div_password').remove();
		$('#div_share_game').fadeIn();
	});
	socket.on('reload_players', function(msg){
    var players = msg;
    build_player_panel(players);
	});
	socket.on('chat_income', function(msg){
    add_to_chat(msg);
	});
	socket.on('join_failed', function(msg){
		sweetAlert({
				title: l('Connection failed'),
				text: l('The room is full!'),
				type: "error",
		});
		window.location = 'lobby.php';
	});
	socket.on('join_failed_password', function(msg){
		sweetAlert({
				title: l('Connection failed'),
				text: l('Wrong password!'),
				type: "error",
		}, function() {
			window.location.href = 'lobby.php';
		});
	});
	socket.on('join_password_needed', function(msg){
    show_password_panel(msg);
	});
  socket.on('incoming_draw', function(msg) {
    incomingDraw(msg);
  });
  socket.on('incoming_clear_area', function(msg) {
    clearArea(false);
  });
  socket.on('start_new_round_with_draw', function(msg) {
    startGame(true, msg);
  });
  socket.on('start_new_round', function(msg) {
    startGame(false, msg);
  });
  socket.on('guessed_right', function(msg) {
    guessedRight(msg);
  });
  socket.on('wait_for_player', function(msg) {
    waitForPlayer(true);
  });
  socket.on('send_full_pic', function(msg) {
    sendPic(msg);
  });
  socket.on('get_full_pic', function(msg) {
    getPic(msg['data']);
    initTimeArea(msg['time']);
  });
  socket.on('get_new_word', function(msg) {
    $('#paint_word').html(msg);
  });
  socket.on('get_new_time', function(msg) {
    initTimeArea(msg);
  });
  socket.on('guessed_right', function(msg) {
    guessedCorrect(msg);
  });
	socket.on('scale_area', function(msg) {
		var scaleX = parseInt($('#paint').css('width')) / msg["width"];
		var scaleY = parseInt($('#paint').css('height')) / msg["height"];
		ctx.scale(scaleX,scaleY);
	});
  socket.on('was_kicked', function(msg) {
    initPaintArea(false);
    $('#paint_word').html('');
    $('#timer').html('');
    sweetAlert({
        title: l('Oops')+"...",
        text: l('The players kicked you out the room!'),
        type: "error",
    }, function() {window.location.href = 'lobby.php';});
  });
  initPaintArea(false);
});

function initChatHeight() {
	var height = $(window).height() - $('#div_chat_content').offset().top;
	$('#div_chat_content').css('height',height.toString() + 'px');
}

function l(val, replaces) {
	replaces = replaces || [];
	var label = locals[val];
	if(replaces.length > 0) {
		while(label.indexOf('%s') !== -1) {
			label = label.replace('%s',replaces[0]);
			replaces.shift();
		}
	}
	console.log(label)
	return label
}

function add_to_chat(chat_array) {
  var color = chat_array['color'];
  if(color === '' || color === undefined) {
    color = 'ffffff';
  }
  var html = "<p> <span class='span_chat_player' style='color:#"+color+"'>"+chat_array['player-name']+":</span> ";
  html += chat_array['message'] + "</p>";
  $('#div_chat_content').append(html);
  $('#div_chat_content')[0].scrollTop = $('#div_chat_content')[0].scrollHeight;
}

function submit_chat_message() {
  socket.emit('chat_message', $('.chat-input').val());
  $('.chat-input').val('');
}

function kick_player(sid) {
  swal({
      title: l('Kick the player?'),
      text: l('Do you really want to kick this player?'),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: l('Yes'),
      cancelButtonText: l('No'),
      closeOnConfirm: false
    },
    function() {
      socket.emit('kick_player',sid);
      swal(l('Done!'), l('Your vote was accepted!'), "success");
    }
  );
}

function guessedCorrect(data) {
  swal({
    title: l('Right!'),
    type: "success",
    text: l('You guessed %s correctly and you earn %s points!',[data['word'],data['points']]),
    timer: 4000,
    showConfirmButton: true
  });
}

function build_player_panel(players) {
  var html = "";
  for (var i = 0; i < players.length; i++) {
		var cur_player = players[i];
		html += '<div class="sidebar-item" onclick="kick_player(\''+cur_player['clean_id']+'\');">';
		html += cur_player['name'];
		html += '<span id="points" class="badge">'+cur_player['points'].toString()+'</span>';
		if(cur_player['drawer'] || cur_player['finished']) {
			html += '<span class="badge">'+(cur_player['drawer'] ? pencil_icon : (cur_player['finished'] ? finished_icon : ''))+'</span>';
		}
		html += '</div>';
  }
	$('#player_sidebar .sidebar-content .sidebar-players').html(html);
}

function openModal(id) {
	$('.modal-container:not(#'+id+')').removeClass('modal-open');
	$('#'+id).toggleClass('modal-open');
	$('#body-container').toggleClass('is-blurred');
}

function refresh_rooms() {
  socket.emit('get_rooms',1);
}

function show_password_panel(room) {
	openModal('password_modal');
}

function submit_join_password(room) {
	openModal('password_modal');
  socket.emit('join_private_room', {'room_no': room, 'password': $('#txt_password').val()});
}

function submit_username(val) {
	socket.emit('username', val);
}

function join_room(room_no) {
	socket.emit('join_room', room_no);
}

function initPaintArea(draw) {
    $('#myCanvas').off();
    mousePressed = false
    is_drawer = draw;
    ctx = document.getElementById('myCanvas').getContext("2d");
    var canvas = document.getElementById('myCanvas');
    var painting = document.getElementById('paint');
    var paint_style = getComputedStyle(painting);
    canvas.width = parseInt(paint_style.getPropertyValue('width'));
    canvas.height = parseInt(paint_style.getPropertyValue('height'));
    if(draw === true) {
      $('#selWidth').val('3');
      $('#control_paint').show();
      initColor();
			socket.emit('init_area', {'width': parseInt($('#paint').css('width')), 'height': parseInt($('#paint').css('height'))});
      $('#myCanvas').on('touchstart', function (e) {
				mousePressed = true;
				e = e.touches[0];
				DrawSinglePoint(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, $('#selWidth').val(), getColor());
				socket.emit('send_brush', {'x': e.pageX - $(this).offset().left, 'y': e.pageY - $(this).offset().top, 'is_down': false, 'mouse_pressed': mousePressed, 'brush_width': $('#selWidth').val(), 'brush_color': getColor(), 'single_point': true, 'resX': parseInt($('#paint').css('width')), 'resY': parseInt($('#paint').css('height'))});
				Draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, false, mousePressed, $('#selWidth').val(), getColor());
				socket.emit('send_brush', {'x': e.pageX - $(this).offset().left, 'y': e.pageY - $(this).offset().top, 'is_down': false, 'mouse_pressed': mousePressed, 'brush_width': $('#selWidth').val(), 'brush_color': getColor(), 'single_point': false, 'resX': parseInt($('#paint').css('width')), 'resY': parseInt($('#paint').css('height'))});
			});
      $('#myCanvas').on('mousedown', function (e) {
        mousePressed = true;
        DrawSinglePoint(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, $('#selWidth').val(), getColor());
        socket.emit('send_brush', {'x': e.pageX - $(this).offset().left, 'y': e.pageY - $(this).offset().top, 'is_down': false, 'mouse_pressed': mousePressed, 'brush_width': $('#selWidth').val(), 'brush_color': getColor(), 'single_point': true, 'resX': parseInt($('#paint').css('width')), 'resY': parseInt($('#paint').css('height'))});
        Draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, false, mousePressed, $('#selWidth').val(), getColor());
        socket.emit('send_brush', {'x': e.pageX - $(this).offset().left, 'y': e.pageY - $(this).offset().top, 'is_down': false, 'mouse_pressed': mousePressed, 'brush_width': $('#selWidth').val(), 'brush_color': getColor(), 'single_point': false, 'resX': parseInt($('#paint').css('width')), 'resY': parseInt($('#paint').css('height'))});
      });
      $('#myCanvas').on('mousemove', function (e) {
        Draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, true, mousePressed, $('#selWidth').val(), getColor());
        socket.emit('send_brush', {'x': e.pageX - $(this).offset().left, 'y': e.pageY - $(this).offset().top, 'is_down': true, 'mouse_pressed': mousePressed, 'brush_width': $('#selWidth').val(), 'brush_color': getColor(), 'single_point': false, 'resX': parseInt($('#paint').css('width')), 'resY': parseInt($('#paint').css('height'))});
      });
      $('#myCanvas').on('touchmove', function (e) {
				e.preventDefault();
				e = e.touches[0];
        Draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, true, mousePressed, $('#selWidth').val(), getColor());
        socket.emit('send_brush', {'x': e.pageX - $(this).offset().left, 'y': e.pageY - $(this).offset().top, 'is_down': true, 'mouse_pressed': mousePressed, 'brush_width': $('#selWidth').val(), 'brush_color': getColor(), 'single_point': false, 'resX': parseInt($('#paint').css('width')), 'resY': parseInt($('#paint').css('height'))});
      });
      $('#myCanvas').on('mouseup mouseleave touchend touchcancel touchleave', function (e) {
        mousePressed = false;
      });
  } else {
    $('#myCanvas').off();
    $('#control_paint').hide();
  }
}

function Draw(x, y, isDown, mouse_pressed, brush_width, brush_color) {
  if(mouse_pressed) {
    if (isDown) {
        ctx.beginPath();
        ctx.strokeStyle = "#" + brush_color;
        ctx.lineWidth = brush_width;
        ctx.lineJoin = "round";
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.stroke();
    }
    lastX = x; lastY = y;
  }
}

function DrawSinglePoint(x, y, brush_width, brush_color) {
    ctx.fillStyle = "#" + brush_color;
    ctx.beginPath();
    ctx.arc(x,y,brush_width / 2, 0, 2*Math.PI);
    ctx.fill();
}

function incomingDraw(data) {
  var mouseX = data['x'];
  var mouseY = data['y'];
  var isDown = data['is_down'];
  var mpressed = data['mouse_pressed'];
  var brush_width = data['brush_width'];
  var brush_color = data['brush_color'];
  if(data['single_point'] === false) {
    Draw(mouseX, mouseY, isDown, mpressed, brush_width, brush_color);
  } else {
    DrawSinglePoint(mouseX, mouseY, brush_width, brush_color);
  }
}

function clearArea(do_it) {
    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if(do_it === true) {
      socket.emit('send_clear_area', '1');
    }
}

function initTimeArea(current_time) {
  //~ current_time = 90;
  $('#timer').html(current_time);
  window.clearInterval(timer_interval_id);
  timer_interval_id = setInterval(function(){ countDown(); }, 1000);
}

function countDown() {
  var current_time = parseInt($('#timer').html());
  if(current_time > 0) {
    current_time -= 1;
    $('#timer').html(current_time);
    socket.emit('im_alive', current_time);
  } else {
    window.clearInterval(timer_interval_id);
    timer_interval_id = null;
    is_drawer = false;
    setTimeout(function() {
      if(parseInt($('#timer').html()) === 0) {
        socket.emit('draw_end', $('#round_id').val());
      }
    }, 3000);
  }
}

function startGame(draw, data) {
  window.clearInterval(timer_interval_id);
  if(draw === true) {
    initPaintArea(true);
  } else {
    initPaintArea(false);
  }
  initTimeArea(90);
  $('#paint_word').html(data['word']);
  $('#span_round').html(data['round'] + "/3");
  $('#round_id').val(data['id']);
}

function waitForPlayer(on) {
	var chat_data = {'player-name': 'SYSTEM', 'color': 'ffffff'};
	var message = l('You are alone :( Maybe you want to invite your friends?');
	message += '<br/>';
	var share_url = location.protocol + "//" + location.host+'/en/lobby.php?room_id='+room.toString();
	message += share_url;
	chat_data['message'] = message;
	add_to_chat(chat_data);
}

function openPlayerModal() {

}

function guessedRight(data) {
  $('#paint_word').html(data['word']);
}

function submit_password(pass, words) {
	if(pass !== '') {
		socket.emit('create_and_join_private_room', {'password': pass, 'words': words});
	} else {
		sweetAlert({
				title: l('Failure!'),
				text: l('Can not create a private room without a password!'),
				type: "error",
		});
		l('Password')
	}
}

function skipTurn() {
  socket.emit('skip_turn', '1');
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function hexc(colorval) {
    var parts = colorval.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    delete(parts[0]);
    for (var i = 1; i <= 3; ++i) {
        parts[i] = parseInt(parts[i]).toString(16);
        if (parts[i].length == 1) parts[i] = '0' + parts[i];
    }
    color = parts.join('');
    return color;
}

function initColor() {
	$('.colorbox').removeClass('active-color');
	$('.initcolor').addClass('active-color');
}

function getColor() {
	return hexc($('.colorbox.active-color').children().css('background-color'));
}
