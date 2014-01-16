// Generated by LiveScript 1.2.0
var rgb2hsl, hsl2rgb, Brush, WireframeBrush, ColorSamplerBrush, Lenny, EraserBrush, CopyPasteBrush, getBrush, sketchBrush;
rgb2hsl = function(rgbcolor){
  var r, g, b, h, s, l, min, max, delta_max, delta_r, delta_g, delta_b;
  r = rgbcolor[0] / 255.0;
  g = rgbcolor[1] / 255.0;
  b = rgbcolor[2] / 255.0;
  min = Math.min(r, g, b);
  max = Math.max(r, g, b);
  delta_max = max - min;
  l = (min + max) / 2.0;
  if (delta_max === 0) {
    h = s = 0;
  } else {
    s = l < 0.5
      ? delta_max / (max + min)
      : delta_max / (2.0 - max - min);
    delta_r = ((max - r) / 6.0 + delta_max / 2.0) / delta_max;
    delta_g = ((max - g) / 6.0 + delta_max / 2.0) / delta_max;
    delta_b = ((max - b) / 6.0 + delta_max / 2.0) / delta_max;
    console.log("r, g, b, max: " + r + "," + g + "," + b + "," + max);
    if (r === max) {
      h = delta_b - delta_g;
    } else if (g === max) {
      h = 1.0 / 3.0 + delta_r - delta_b;
    } else if (b === max) {
      h = 2.0 / 3.0 + delta_g - delta_r;
    }
    if (h < 0.0) {
      h += 1.0;
    }
    if (h > 1.0) {
      h -= 1.0;
    }
  }
  return [h, s, l];
};
hsl2rgb = function(hslcolor){
  var r, g, b, h, s, l, temp0, temp1, huefunc;
  h = hslcolor[0];
  s = hslcolor[1];
  l = hslcolor[2];
  if (s === 0) {
    r = g = b = Math.round(l * 255.0);
  } else {
    temp0 = l < 0.5
      ? l * (1.0 + s)
      : (l + s) - s * l;
    temp1 = 2 * l - temp0;
    huefunc = function(v1, v2, vH){
      if (vH < 0.0) {
        vH += 1.0;
      }
      if (vH > 1.0) {
        vH -= 1.0;
      }
      if (6.0 * vH < 1.0) {
        return v1 + (v2 - v1) * 6.0 * vH;
      }
      if (2.0 * vH < 1.0) {
        return v2;
      }
      if (3.0 * vH < 2.0) {
        return v1 + (v2 - v1) * (2.0 / 3.0 - vH) * 6.0;
      }
      return v1;
    };
    r = Math.round(255.0 * huefunc(temp0, temp1, h + 1.0 / 3.0));
    g = Math.round(255.0 * huefunc(temp0, temp1, h));
    b = Math.round(255.0 * huefunc(temp0, temp1, h - 1.0 / 3.0));
  }
  return [r, g, b];
};
Brush = (function(){
  Brush.displayName = 'Brush';
  var prototype = Brush.prototype, constructor = Brush;
  function Brush(radius, color, canvas){
    this.type = "default";
    this.isTool = false;
    this.radius = radius;
    this.color = color;
    this.canvas = canvas;
  }
  prototype.actionStart = function(x, y){
    this.canvas.context.moveTo(x, y);
    this.canvas.context.strokeStyle = "rgba(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + "," + this.color[3] + ")";
    this.canvas.context.beginPath();
    this.canvas.context.lineWidth = this.radius;
    this.canvas.context.lineJoin = this.canvas.context.lineCap = 'round';
  };
  prototype.actionEnd = function(){
    this.canvas.context.closePath();
  };
  prototype.actionMove = function(x, y){
    this.canvas.context.lineTo(x, y);
    this.canvas.context.stroke();
    this.canvas.action.data.push([x, y]);
  };
  prototype.actionMoveData = function(data){
    var i$, len$, p;
    for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
      p = data[i$];
      this.canvas.context.lineTo(p[0], p[1]);
    }
    this.canvas.context.stroke();
  };
  prototype.doAction = function(data){
    var i$, len$, p;
    if (data.length !== 0) {
      this.actionStart(data[0][0], data[0][1]);
      for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
        p = data[i$];
        this.canvas.context.lineTo(p[0], p[1]);
      }
      this.canvas.context.stroke();
      this.actionEnd();
    }
  };
  return Brush;
}());
WireframeBrush = (function(superclass){
  var prototype = extend$((import$(WireframeBrush, superclass).displayName = 'WireframeBrush', WireframeBrush), superclass).prototype, constructor = WireframeBrush;
  function WireframeBrush(radius, color, canvas){
    WireframeBrush.superclass.apply(this, arguments);
    this.type = "wireframe";
  }
  prototype.actionStart = function(x, y){
    this.canvas.context.moveTo(x, y);
    this.canvas.context.strokeStyle = "rgba(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + "," + this.color[3] + ")";
    this.canvas.context.beginPath();
    this.canvas.context.lineWidth = this.radius;
  };
  prototype.actionEnd = function(){
    this.canvas.context.closePath();
  };
  prototype.actionMove = function(x, y){
    var numpoints;
    this.canvas.context.lineTo(x, y);
    numpoints = this.canvas.action.data.length;
    if (numpoints >= 4) {
      this.canvas.context.lineTo(this.canvas.action.data[numpoints - 4][0], this.canvas.action.data[numpoints - 4][1]);
    }
    this.canvas.context.stroke();
    this.canvas.action.data.push([x, y]);
  };
  prototype.actionMoveData = function(data){
    var i$, to$, i, nearpoint;
    for (i$ = 1, to$ = data.length; i$ < to$; ++i$) {
      i = i$;
      this.canvas.context.lineTo(data[i][0], data[i][1]);
      nearpoint = data[i - 5];
      if (nearpoint) {
        this.canvas.context.moveTo(nearpoint[0], nearpoint[1]);
        this.canvas.context.lineTo(data[i][0], data[i][1]);
      }
    }
    this.canvas.context.stroke();
  };
  prototype.doAction = function(data){
    var i$, to$, i, nearpoint;
    if (data.length !== 0) {
      this.actionStart(data[0][0], data[0][1]);
      for (i$ = 1, to$ = data.length; i$ < to$; ++i$) {
        i = i$;
        this.canvas.context.lineTo(data[i][0], data[i][1]);
        nearpoint = data[i - 5];
        if (nearpoint) {
          this.canvas.context.moveTo(nearpoint[0], nearpoint[1]);
          this.canvas.context.lineTo(data[i][0], data[i][1]);
        }
      }
      this.canvas.context.stroke();
      this.actionEnd();
    }
  };
  return WireframeBrush;
}(Brush));
ColorSamplerBrush = (function(superclass){
  var prototype = extend$((import$(ColorSamplerBrush, superclass).displayName = 'ColorSamplerBrush', ColorSamplerBrush), superclass).prototype, constructor = ColorSamplerBrush;
  function ColorSamplerBrush(radius, color, canvas){
    ColorSamplerBrush.superclass.apply(this, arguments);
    this.type = "sampler";
  }
  prototype.actionStart = function(x, y){
    var p, a;
    p = this.canvas.context.getImageData(x, y, 1, 1).data;
    a = p[3] / 255.0;
    this.canvas.doColorChange([p[0], p[1], p[2], a]);
  };
  prototype.actionEnd = function(){
    return;
  };
  prototype.actionMove = function(x, y){
    this.actionStart(x, y);
  };
  prototype.actionMoveData = function(data){};
  prototype.doAction = function(data){
    return;
  };
  return ColorSamplerBrush;
}(Brush));
Lenny = (function(superclass){
  var prototype = extend$((import$(Lenny, superclass).displayName = 'Lenny', Lenny), superclass).prototype, constructor = Lenny;
  function Lenny(radius, color, canvas){
    Lenny.superclass.apply(this, arguments);
    this.type = "lenny";
  }
  prototype.actionStart = function(x, y){
    this.canvas.context.moveTo(x, y);
    this.canvas.context.fillStyle = "rgba(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + "," + this.color[3] + ")";
    this.canvas.context.font = "bold " + this.radius + "px arial";
    this.canvas.context.fillText("( ͡° ͜ʖ ͡°)", x, y);
  };
  prototype.actionEnd = function(){
    return;
  };
  prototype.actionMove = function(x, y){
    this.canvas.context.fillText("( ͡° ͜ʖ ͡°)", x, y);
    this.canvas.action.data.push([x, y]);
  };
  prototype.actionMoveData = function(data){
    var i$, len$, p;
    for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
      p = data[i$];
      this.canvas.context.fillText("( ͡° ͜ʖ ͡°)", p[0], p[1]);
    }
  };
  prototype.doAction = function(data){
    var i$, len$, p;
    if (data.length !== 0) {
      this.actionStart(data[0][0], data[0][1]);
      for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
        p = data[i$];
        this.canvas.context.fillText("( ͡° ͜ʖ ͡°)", p[0], p[1]);
      }
    }
  };
  return Lenny;
}(Brush));
EraserBrush = (function(superclass){
  var prototype = extend$((import$(EraserBrush, superclass).displayName = 'EraserBrush', EraserBrush), superclass).prototype, constructor = EraserBrush;
  function EraserBrush(radius, color, canvas){
    EraserBrush.superclass.apply(this, arguments);
    this.type = "eraser";
  }
  prototype.actionStart = function(x, y){
    var corner_x, corner_y;
    corner_x = x - this.radius >= 0 ? x - this.radius : 0;
    corner_y = y - this.radius >= 0 ? y - this.radius : 0;
    this.canvas.context.clearRect(corner_x, corner_y, this.radius * 2, this.radius * 2);
    this.canvas.action.data.push([x, y]);
  };
  prototype.actionEnd = function(){
    return;
  };
  prototype.actionMove = function(x, y){
    var corner_x, corner_y;
    corner_x = x - this.radius >= 0 ? x - this.radius : 0;
    corner_y = y - this.radius >= 0 ? y - this.radius : 0;
    this.canvas.context.clearRect(corner_x, corner_y, this.radius * 2, this.radius * 2);
    this.canvas.action.data.push([x, y]);
  };
  prototype.actionMoveData = function(data){
    var i$, len$, p, corner_x, corner_y;
    for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
      p = data[i$];
      corner_x = p[0] - this.radius >= 0 ? p[0] - this.radius : 0;
      corner_y = p[1] - this.radius >= 0 ? p[1] - this.radius : 0;
      this.canvas.context.clearRect(corner_x, corner_y, this.radius * 2, this.radius * 2);
    }
  };
  prototype.doAction = function(data){
    var i$, len$, p, corner_x, corner_y;
    if (data.length !== 0) {
      for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
        p = data[i$];
        corner_x = p[0] - this.radius >= 0 ? p[0] - this.radius : 0;
        corner_y = p[1] - this.radius >= 0 ? p[1] - this.radius : 0;
        this.canvas.context.clearRect(corner_x, corner_y, this.radius * 2, this.radius * 2);
      }
    }
  };
  return EraserBrush;
}(Brush));
CopyPasteBrush = (function(superclass){
  var prototype = extend$((import$(CopyPasteBrush, superclass).displayName = 'CopyPasteBrush', CopyPasteBrush), superclass).prototype, constructor = CopyPasteBrush;
  function CopyPasteBrush(radius, color, canvas){
    CopyPasteBrush.superclass.apply(this, arguments);
    this.type = "copypaste";
    this.imgData = void 8;
  }
  prototype.actionStart = function(x, y){
    var corner_x, corner_y;
    corner_x = x - this.radius >= 0 ? x - this.radius : 0;
    corner_y = y - this.radius >= 0 ? y - this.radius : 0;
    this.imgData = this.canvas.context.getImageData(corner_x, corner_y, this.radius * 2, this.radius * 2);
    this.canvas.action.data.push([x, y]);
  };
  prototype.actionEnd = function(){
    return;
  };
  prototype.actionMove = function(x, y){
    var corner_x, corner_y;
    corner_x = x - this.radius >= 0 ? x - this.radius : 0;
    corner_y = y - this.radius >= 0 ? y - this.radius : 0;
    this.canvas.context.putImageData(this.imgData, corner_x, corner_y);
    this.canvas.action.data.push([x, y]);
  };
  prototype.actionMoveData = function(data){
    var i$, len$, p, corner_x, corner_y;
    for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
      p = data[i$];
      corner_x = p[0] - this.radius >= 0 ? p[0] - this.radius : 0;
      corner_y = p[1] - this.radius >= 0 ? p[1] - this.radius : 0;
      this.canvas.context.putImageData(this.imgData, corner_x, corner_y);
    }
  };
  prototype.doAction = function(data){
    var corner_x, corner_y, i$, len$, p;
    if (data.length !== 0) {
      corner_x = data[0][0] - this.radius >= 0 ? data[0][0] - this.radius : 0;
      corner_y = data[0][1] - this.radius >= 0 ? data[0][1] - this.radius : 0;
      this.imgData = this.canvas.context.getImageData(corner_x, corner_y, this.radius * 2, this.radius * 2);
      for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
        p = data[i$];
        corner_x = p[0] - this.radius >= 0 ? p[0] - this.radius : 0;
        corner_y = p[1] - this.radius >= 0 ? p[1] - this.radius : 0;
        this.canvas.context.putImageData(this.imgData, corner_x, corner_y);
      }
    }
  };
  return CopyPasteBrush;
}(Brush));
getBrush = function(brushtype, radius, color, canvas){
  switch (false) {
  case brushtype !== 'default':
    return new Brush(radius, color, canvas);
  case brushtype !== 'wireframe':
    return new WireframeBrush(radius, color, canvas);
  case brushtype !== 'sampler':
    return new ColorSamplerBrush(radius, color, canvas);
  case brushtype !== 'lenny':
    return new Lenny(radius, color, canvas);
  case brushtype !== 'eraser':
    return new EraserBrush(radius, color, canvas);
  case brushtype !== 'copypaste':
    return new CopyPasteBrush(radius, color, canvas);
  }
};
sketchBrush = function(context, event, points){
  var lastPoint, i$, len$, i, dx, dy, d, results$ = [];
  points.push([{
    x: event.clientX,
    y: event.clientY
  }]);
  context.moveTo(points[points.length - 2].x, points[points.length - 2].y);
  context.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  context.stroke();
  lastPoint = points[points.length - 1];
  for (i$ = 0, len$ = points.length; i$ < len$; ++i$) {
    i = points[i$];
    dx = points[i].x - lastPoint.x;
    dy = points[i].y - lastPoint.y;
    d = dx * dx + dy * dy;
    if (d < 1000) {
      context.beginPath();
      context.strokeStyle = 'rgba(0,0,0,0.3)';
      context.moveTo(lastPoint.x + dx * 0.2, lastPoint.y + dy * 0.2);
      context.ctx.lineTo(points[i].x - dx * 0.2, points[i].y - dy * 0.2);
      results$.push(context.stroke());
    }
  }
  return results$;
};
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}