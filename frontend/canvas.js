// Generated by LiveScript 1.2.0
var Action, User, canvas_script;
Action = (function(){
  Action.displayName = 'Action';
  var prototype = Action.prototype, constructor = Action;
  function Action(id, brushtype, radius, color, coords){
    this.id = id;
    this.brushtype = brushtype;
    this.radius = radius;
    this.fillColor = color;
    this.data = coords;
  }
  return Action;
}());
User = (function(){
  User.displayName = 'User';
  var prototype = User.prototype, constructor = User;
  function User(id){
    this.id = id;
  }
  return User;
}());
canvas_script = function(){
  var createCanvas, init;
  createCanvas = function(parent, width, height){
    var canvas;
    width == null && (width = 100);
    height == null && (height = 100);
    canvas = {};
    canvas.node = document.createElement('canvas');
    canvas.node.width = width;
    canvas.node.height = height;
    canvas.node.style.cursor = 'url("content/cursor_pencil.png"), url("content/cursor_pencil.cur"), pointer';
    canvas.context = canvas.node.getContext('2d');
    parent.appendChild(canvas.node);
    return canvas;
  };
  return init = function(container_id, width, height, fillColor, brushRadius){
    var container, canvas, context, points, pool, i$, i, getCoordinates;
    container = document.getElementById(container_id);
    canvas = createCanvas(container, width, height);
    context = canvas.context;
    points = {};
    canvas.colorwheel = {};
    canvas.colorwheel.canvas = document.createElement('canvas');
    canvas.colorwheel.context = canvas.colorwheel.canvas.getContext('2d');
    canvas.colorwheel.context.drawImage(document.getElementById('colorwheel'), 0, 0);
    canvas.id = "";
    pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (i$ = 0; i$ <= 20; ++i$) {
      i = i$;
      canvas.id += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    canvas.brushRadius = brushRadius;
    canvas.history = [];
    canvas.users = {};
    canvas.action = new Action('self', 'default', brushRadius, fillColor, []);
    canvas.brush = new Brush(brushRadius, fillColor, canvas);
    canvas.connection = new WebSocket('ws://localhost:9002/');
    canvas.connection.onopen = function(){
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'join'
      }));
      return;
    };
    canvas.connection.onerror = function(error){};
    canvas.connection.onmessage = function(e){
      var message, cur_user, tempAction, x;
      console.log(e.data);
      message = JSON.parse(e.data);
      if (message.id) {
        switch (message.action) {
        case 'join':
          canvas.users[message.id] = new User(message.id);
          canvas.users[message.id].brush = new Brush(10, '#000000', canvas);
          canvas.users[message.id].action = new Action(message.id, 'default', 10);
          break;
        case 'action-start':
          cur_user = canvas.users[message.id];
          cur_user.action = new Action(message.id, cur_user.brush.type, message.data.radius, message.data.fillColor, []);
          break;
        case 'action-data':
          canvas.users[message.id].action.data.push(message.data);
          canvas.userdraw(message.id, message.data[0], message.data[1]);
          break;
        case 'action-end':
          cur_user = canvas.users[message.id];
          tempAction = new Action(message.id, cur_user.brush.type, cur_user.action.radius, cur_user.action.fillColor, (function(){
            var i$, ref$, len$, results$ = [];
            for (i$ = 0, len$ = (ref$ = cur_user.action.data).length; i$ < len$; ++i$) {
              x = ref$[i$];
              results$.push(x);
            }
            return results$;
          }()));
          canvas.history.push(tempAction);
          break;
        case 'undo':
          canvas.undo(message.id);
          break;
        case 'radius-change':
          canvas.users[message.id].brush.radius = message.data;
          canvas.users[message.id].action.radius = message.data;
          break;
        case 'color-change':
          canvas.users[message.id].brush.color = message.data;
          canvas.users[message.id].action.fillColor = message.data;
          break;
        case 'brush-change':
          cur_user = canvas.users[message.id];
          cur_user.brush = getBrush(message.data, cur_user.action.radius, cur_user.action.fillColor, canvas);
        }
      } else {}
    };
    context.fillCircle = function(x, y, radius, fillColor){
      this.fillStyle = fillColor;
      this.beginPath();
      this.moveTo(x, y);
      this.arc(x, y, radius, 0, Math.PI * 2, false);
      this.fill();
    };
    canvas.userdraw = function(user_id, x, y){
      var temp_user, ref$, tempcoords;
      temp_user = canvas.users[user_id];
      if (!temp_user.brush.isTool) {
        if (canvas.isDrawing) {
          canvas.brush.actionEnd();
        }
        [(ref$ = temp_user.action.data.push)[x], ref$[y]];
        temp_user.brush.doAction(temp_user.action.data);
        if (canvas.isDrawing) {
          tempcoords = canvas.action.data[0];
          canvas.brush.actionStart(tempcoords[0], tempcoords[1]);
          canvas.brush.actionMoveData(canvas.action.data);
        }
      }
    };
    canvas.node.onmousemove = function(e){
      var x, y;
      if (!canvas.isDrawing) {
        return;
      }
      x = e.clientX;
      y = e.clientY;
      canvas.brush.actionMove(x, y);
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'action-data',
        data: [x, y]
      }));
    };
    canvas.redraw = function(){
      var tempBrush, i$, ref$, len$, x;
      canvas.context.clearRect(0, 0, canvas.node.width, canvas.node.height);
      tempBrush = canvas.brush;
      for (i$ = 0, len$ = (ref$ = canvas.history).length; i$ < len$; ++i$) {
        x = ref$[i$];
        canvas.brush = getBrush(x.brushtype, x.radius, x.fillColor, canvas);
        if (!canvas.brush.isTool) {
          canvas.brush.doAction(x.data);
        }
      }
      canvas.brush = tempBrush;
    };
    canvas.undo = function(user_id){
      var i$, i, tempcoords;
      if (user_id === 'self') {
        canvas.connection.send(JSON.stringify({
          id: canvas.id,
          action: 'undo'
        }));
      }
      if (canvas.isDrawing) {
        canvas.brush.actionEnd();
      }
      for (i$ = canvas.history.length - 1; i$ >= 0; --i$) {
        i = i$;
        if (canvas.history[i].id = user_id) {
          canvas.history.splice(i, 1);
          break;
        }
      }
      if (canvas.isDrawing) {
        tempcoords = canvas.action.data[0];
        canvas.brush.actionStart(tempcoords[0], tempcoords[1]);
        canvas.brush.actionMoveData(canvas.action.data);
      }
      canvas.redraw();
    };
    canvas.node.onmousedown = function(e){
      canvas.isDrawing = true;
      canvas.brush.actionStart(e.clientX, e.clientY);
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'action-start',
        data: {
          radius: canvas.action.radius,
          fillColor: canvas.action.fillColor
        }
      }));
    };
    canvas.node.onmouseup = function(e){
      var tempAction, x;
      canvas.isDrawing = false;
      tempAction = new Action('self', canvas.brush.type, canvas.action.radius, canvas.action.fillColor, (function(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = canvas.action.data).length; i$ < len$; ++i$) {
          x = ref$[i$];
          results$.push(x);
        }
        return results$;
      }()));
      canvas.history.push(tempAction);
      canvas.action.data = [];
      canvas.brush.actionEnd();
      canvas.redraw();
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'action-end'
      }));
    };
    canvas.doColorChange = function(color){
      canvas.action.fillColor = color;
      canvas.brush.color = color;
      document.getElementById('color-value').value = color[0] + "," + color[1] + "," + color[2] + "," + color[3];
      document.getElementById('alphaslider').value = "" + color[3];
      document.getElementById('brightnessslider').value = "" + rgb2hsl(color)[2];
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'color-change',
        data: color
      }));
    };
    window.onkeydown = function(e){
      if (e.ctrlKey) {
        canvas.ctrlActivated = true;
      }
    };
    window.onkeyup = function(e){
      switch (e.keyCode) {
      case 90:
        if (canvas.ctrlActivated) {
          canvas.undo('self');
        }
      }
      if (e.ctrlKey) {
        canvas.ctrlActivated = false;
      }
    };
    document.getElementById('color-value').onblur = function(e){
      var colorparts;
      colorparts = this.value.split(',');
      canvas.doColorChange([parseInt(colorparts[0]), parseInt(colorparts[1]), parseInt(colorparts[2]), parseFloat(colorparts[3])]);
    };
    document.getElementById('radius-value').onkeypress = function(e){
      canvas.action.radius = this.value;
      canvas.brush.radius = this.value;
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'radius-change',
        data: this.value
      }));
    };
    document.getElementById('download').onclick = function(e){
      window.open(canvas.node.toDataURL(), 'Download');
    };
    document.getElementById('csampler').onclick = function(e){
      canvas.brush = new ColorSamplerBrush(canvas.action.radius, canvas.action.fillColor, canvas);
      canvas.node.style.cursor = 'url("content/cursor_pipet.png"), url("content/cursor_pipet.cur"), pointer';
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'brush-change',
        data: 'sampler'
      }));
    };
    document.getElementById('pencil-brush').onclick = function(e){
      canvas.brush = new Brush(canvas.action.radius, canvas.action.fillColor, canvas);
      canvas.node.style.cursor = 'url("content/cursor_pencil.png"), url("content/cursor_pencil.cur"), pointer';
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'brush-change',
        data: 'default'
      }));
    };
    document.getElementById('wireframe-brush').onclick = function(e){
      canvas.brush = new WireframeBrush(canvas.action.radius, canvas.action.fillColor, canvas);
      canvas.node.style.cursor = 'url("content/cursor_wireframe.png"), url("content/cursor_wireframe.cur"), pointer';
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'brush-change',
        data: 'wireframe'
      }));
    };
    document.getElementById('lenny-brush').onclick = function(e){
      canvas.brush = new Lenny(canvas.action.radius, canvas.action.fillColor, canvas);
      canvas.node.style.cursor = 'url("content/cursor_pencil.png"), url("content/cursor_pencil.cur"), pointer';
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'brush-change',
        data: 'lenny'
      }));
    };
    document.getElementById('eraser-brush').onclick = function(e){
      canvas.brush = new EraserBrush(canvas.action.radius, canvas.action.fillColor, canvas);
      canvas.node.style.cursor = 'url("content/cursor_pencil.png"), url("content/cursor_pencil.cur"), pointer';
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'brush-change',
        data: 'eraser'
      }));
    };
    document.getElementById('copypaste-brush').onclick = function(e){
      canvas.brush = new CopyPasteBrush(canvas.action.radius, canvas.action.fillColor, canvas);
      canvas.node.style.cursor = 'url("content/cursor_pencil.png"), url("content/cursor_pencil.cur"), pointer';
      canvas.connection.send(JSON.stringify({
        id: canvas.id,
        action: 'brush-change',
        data: 'copypaste'
      }));
    };
    getCoordinates = function(e, element){
      var PosX, PosY, imgPos;
      PosX = 0;
      PosY = 0;
      imgPos = [0, 0];
      if (element.offsetParent !== undefined) {
        while (element) {
          imgPos[0] += element.offsetLeft;
          imgPos[1] += element.offsetTop;
          element = element.offsetParent;
        }
      } else {
        imgPos = [element.x, element.y];
      }
      if (!e) {
        e = window.event;
      }
      if (e.pageX || e.pageY) {
        PosX = e.pageX;
        PosY = e.pageY;
      } else if (e.clientX || e.clientY) {
        PosX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        PosY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }
      PosX = PosX - imgPos[0];
      PosY = PosY - imgPos[1];
      return [PosX, PosY];
    };
    document.getElementById('colorwheel').onclick = function(e){
      var element, imgcoords, p, a;
      element = document.getElementById('colorwheel');
      imgcoords = getCoordinates(e, element);
      p = canvas.colorwheel.context.getImageData(imgcoords[0], imgcoords[1], 1, 1).data;
      a = p[3] / 255.0;
      canvas.doColorChange([p[0], p[1], p[2], a]);
      return;
    };
    document.getElementById('alphaslider').onchange = function(e){
      canvas.doColorChange([canvas.action.fillColor[0], canvas.action.fillColor[1], canvas.action.fillColor[2], parseFloat(this.value)]);
    };
    document.getElementById('brightnessslider').onchange = function(e){
      var hslcolor, rgbcolor;
      hslcolor = rgb2hsl(canvas.action.fillColor);
      hslcolor[2] = parseFloat(this.value);
      rgbcolor = hsl2rgb(hslcolor);
      canvas.doColorChange([rgbcolor[0], rgbcolor[1], rgbcolor[2], canvas.action.fillColor[3]]);
    };
  };
};