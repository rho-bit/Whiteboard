class Action
	(id, brushtype, radius, color, coords) ->
		@id = id
		@brushtype = brushtype
		@radius = radius
		@fillColor = color
		@data = coords

class User
	(id) ->
		@id = id

canvas_script = ->
	createCanvas = (parent, width=100, height=100) ->

		canvas = {}
		canvas.node = document.createElement 'canvas'
		canvas.node.width = width
		canvas.node.height = height
		canvas.node.style.cursor = 'url(\"content/cursor_pencil.png\"), url(\"content/cursor_pencil.cur\"), pointer'
		canvas.context = canvas.node.getContext '2d'
		parent.appendChild canvas.node
		canvas

	init = (container_id, width, height, fillColor, brushRadius) !->

		container = document.getElementById container_id
		canvas = createCanvas container, width, height
		context = canvas.context
		points = {}
		
		# The colorwheel has to be stored in an in-memory canvas for me to get data from it
		canvas.colorwheel = {}
		canvas.colorwheel.canvas = document.createElement 'canvas'
		canvas.colorwheel.context = canvas.colorwheel.canvas.getContext '2d'
		canvas.colorwheel.context.drawImage (document.getElementById 'colorwheel'), 0, 0

		# Our ID, it'll be replaced with the real one as soon as we
		# send a request to the server to get it
		canvas.id = ""
		pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
		for i from 0 to 20 by 1
			canvas.id += pool.charAt (Math.floor ((Math.random!) * pool.length))

		# Which brush stroke radius to start out at
		canvas.brushRadius = brushRadius

		# History of all commands
		canvas.history = []

		# The current buffer of commands
		# canvas.commands = []
		
		# The current list of users
		canvas.users = {}

		# The canvas's current action
		canvas.action = new Action 'self', 'default', brushRadius, fillColor, []
		
		canvas.brush = new Brush brushRadius, fillColor, canvas

		
		#testing some websocket stuff
		canvas.connection = new WebSocket 'ws://localhost:9002/'
		canvas.connection.onopen = !->

			canvas.connection.send JSON.stringify {id:canvas.id, action:'join'}
			return
		
		# IT WORKS!

		canvas.connection.onerror = (error) !->

			# console.log 'websocket dun goofed: ' + error
			
		canvas.connection.onmessage = (e) !->

			# message format:
			# {id:"aeuaouaeid_here", action:"action_name", data:{whatever_you_want_in_here_i_guess}}
			console.log(e.data)
			message = JSON.parse(e.data)
			if message.id
				switch message.action
				case 'join'
					canvas.users[message.id] = new User message.id
					canvas.users[message.id].brush = new Brush 10, '#000000', canvas
					canvas.users[message.id].action = new Action message.id, 'default', 10, #000000, []
				case 'action-start'
					cur_user = canvas.users[message.id]
					cur_user.action = new Action message.id, cur_user.brush.type, message.data.radius, message.data.fillColor, []
				case 'action-data'
					canvas.users[message.id].action.data.push message.data
					canvas.userdraw message.id, message.data[0], message.data[1]
				case 'action-end'
					cur_user = canvas.users[message.id]
					tempAction = (new Action message.id, cur_user.brush.type, cur_user.action.radius,
					cur_user.action.fillColor, [x for x in cur_user.action.data])
					canvas.history.push tempAction
				case 'undo'
					canvas.undo message.id
				case 'radius-change'
					canvas.users[message.id].brush.radius = message.data
					canvas.users[message.id].action.radius = message.data
				case 'color-change'
					canvas.users[message.id].brush.color = message.data
					canvas.users[message.id].action.fillColor = message.data
				case 'brush-change'
					cur_user = canvas.users[message.id]
					cur_user.brush = getBrush message.data, cur_user.action.radius, cur_user.action.fillColor, canvas
			else
				# console.log "server says: " + e.data

		context.fillCircle = (x,y, radius, fillColor) !->

			this.fillStyle = fillColor
			this.beginPath!
			this.moveTo x,y
			this.arc x,y,radius,0, Math.PI * 2, false
			this.fill!

		canvas.userdraw = (user_id, x, y) !->
			temp_user = canvas.users[user_id]
			unless temp_user.brush.isTool
				if canvas.isDrawing
					canvas.brush.actionEnd!
				temp_user.action.data.push[x,y]
				temp_user.brush.doAction temp_user.action.data
				if canvas.isDrawing
					tempcoords = canvas.action.data[0]
					canvas.brush.actionStart tempcoords[0], tempcoords[1]
					canvas.brush.actionMoveData canvas.action.data

		canvas.node.onmousemove = (e) !->

			return unless canvas.isDrawing

			x = e.clientX #- this.offsetLeft
			y = e.clientY #- this.offsetTop
			
			canvas.brush.actionMove x, y

			# console.log canvas.commands

			canvas.connection.send JSON.stringify {id:canvas.id, action:'action-data', data:[x,y]}

		# TODO: Make something that keeps a frame for every 75 actions or so
		# so that we only have to draw 74 actions, instead of ALL of them
		canvas.redraw = !->

			# Clear the screen
			canvas.context.clearRect 0, 0, canvas.node.width, canvas.node.height
			# store the current brush
			tempBrush = canvas.brush
			# Redraw everything in history
			for x in canvas.history
				canvas.brush = getBrush x.brushtype, x.radius, x.fillColor, canvas
				unless canvas.brush.isTool
					canvas.brush.doAction x.data
			canvas.brush = tempBrush
		
		canvas.undo = (user_id) !->

			if user_id == 'self'
				canvas.connection.send JSON.stringify {id:canvas.id, action:'undo'}
			if canvas.isDrawing
				canvas.brush.actionEnd!
			for i from (canvas.history.length - 1) to 0 by -1
				if canvas.history[i].id = user_id
					canvas.history.splice i, 1
					break
			if canvas.isDrawing
				tempcoords = canvas.action.data[0]
				canvas.brush.actionStart tempcoords[0], tempcoords[1]
				canvas.brush.actionMoveData canvas.action.data
				
			canvas.redraw!

		canvas.node.onmousedown = (e) !->

			canvas.isDrawing = yes
			
			canvas.brush.actionStart e.clientX, e.clientY
			
			#send the action start
			canvas.connection.send JSON.stringify {id:canvas.id, action:'action-start', data:{radius:canvas.action.radius, fillColor:canvas.action.fillColor}}


		canvas.node.onmouseup = (e) !->

			canvas.isDrawing = off

			tempAction = (new Action 'self', canvas.brush.type, canvas.action.radius,
				canvas.action.fillColor, [x for x in canvas.action.data])

			canvas.history.push tempAction

			canvas.action.data = []
			
			canvas.brush.actionEnd!
			
			canvas.redraw!
			
			#send the action end
			canvas.connection.send JSON.stringify {id:canvas.id, action:'action-end'}
			
		# Right now, only the color sampler uses this.
		canvas.doColorChange = (color) !->
			canvas.action.fillColor = color
			canvas.brush.color = color
			(document.getElementById 'color-value').value = color[0] + "," + color[1] + "," + color[2] + "," + color[3]
			(document.getElementById 'alphaslider').value = "" + color[3]
			(document.getElementById 'brightnessslider').value = "" + (rgb2hsl color)[2]
			canvas.connection.send JSON.stringify {id:canvas.id, action:'color-change', data:color}

		window.onkeydown = (e) !->

			if e.ctrlKey
				canvas.ctrlActivated = true

		window.onkeyup = (e) !->

			switch e.keyCode
			case 90
				if canvas.ctrlActivated
					canvas.undo 'self'

			if e.ctrlKey
				canvas.ctrlActivated = false
				
		(document.getElementById 'color-value').onblur = (e) !->
			colorparts = this.value.split ','

			canvas.doColorChange [(parseInt colorparts[0]), (parseInt colorparts[1]), (parseInt colorparts[2]), (parseFloat colorparts[3])]
			
		(document.getElementById 'radius-value').onkeypress = (e) !->

			canvas.action.radius = this.value
			canvas.brush.radius = this.value
			canvas.connection.send JSON.stringify {id:canvas.id, action:'radius-change', data:this.value}

		(document.getElementById 'download').onclick = (e) !->

			window.open (canvas.node.toDataURL!), 'Download'
			
		(document.getElementById 'csampler').onclick = (e) !->

			canvas.brush = new ColorSamplerBrush canvas.action.radius, canvas.action.fillColor, canvas
			canvas.node.style.cursor = 'url(\"content/cursor_pipet.png\"), url(\"content/cursor_pipet.cur\"), pointer'
			canvas.connection.send JSON.stringify {id:canvas.id, action:'brush-change', data:'sampler'}

		(document.getElementById 'pencil-brush').onclick = (e) !->

			canvas.brush = new Brush canvas.action.radius, canvas.action.fillColor, canvas
			canvas.node.style.cursor = 'url(\"content/cursor_pencil.png\"), url(\"content/cursor_pencil.cur\"), pointer'
			canvas.connection.send JSON.stringify {id:canvas.id, action:'brush-change', data:'default'}

		(document.getElementById 'wireframe-brush').onclick = (e) !->

			canvas.brush = new WireframeBrush canvas.action.radius, canvas.action.fillColor, canvas
			canvas.node.style.cursor = 'url(\"content/cursor_wireframe.png\"), url(\"content/cursor_wireframe.cur\"), pointer'
			canvas.connection.send JSON.stringify {id:canvas.id, action:'brush-change', data:'wireframe'}
		
		(document.getElementById 'lenny-brush').onclick = (e) !->

			canvas.brush = new Lenny canvas.action.radius, canvas.action.fillColor, canvas
			canvas.node.style.cursor = 'url(\"content/cursor_pencil.png\"), url(\"content/cursor_pencil.cur\"), pointer'
			canvas.connection.send JSON.stringify {id:canvas.id, action:'brush-change', data:'lenny'}
		
		(document.getElementById 'eraser-brush').onclick = (e) !->

			canvas.brush = new EraserBrush canvas.action.radius, canvas.action.fillColor, canvas
			canvas.node.style.cursor = 'url(\"content/cursor_pencil.png\"), url(\"content/cursor_pencil.cur\"), pointer'
			canvas.connection.send JSON.stringify {id:canvas.id, action:'brush-change', data:'eraser'}
		
		(document.getElementById 'copypaste-brush').onclick = (e) !->

			canvas.brush = new CopyPasteBrush canvas.action.radius, canvas.action.fillColor, canvas
			canvas.node.style.cursor = 'url(\"content/cursor_pencil.png\"), url(\"content/cursor_pencil.cur\"), pointer'
			canvas.connection.send JSON.stringify {id:canvas.id, action:'brush-change', data:'copypaste'}
			
		getCoordinates = (e, element) !->
			PosX = 0
			PosY = 0
			imgPos = [0, 0]
			if(element.offsetParent != undefined)
				while element
					imgPos[0] += element.offsetLeft
					imgPos[1] += element.offsetTop
					element = element.offsetParent
			else
				imgPos = [element.x, element.y]
			unless e
				e = window.event
			if e.pageX || e.pageY
				PosX = e.pageX
				PosY = e.pageY
			else if e.clientX || e.clientY
				PosX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
				PosY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop
			PosX = PosX - imgPos[0]
			PosY = PosY - imgPos[1]
			return [PosX, PosY]

		(document.getElementById 'colorwheel').onclick = (e) !->
			element = document.getElementById 'colorwheel'
			imgcoords = getCoordinates e, element
			p = (canvas.colorwheel.context.getImageData imgcoords[0], imgcoords[1], 1, 1).data
		
			# getImageData gives alpha as an int from 0-255, we need a float from 0.0-1.0
			a = p[3] / 255.0
			
			# hex = "rgba(" + p[0] + "," +  p[1] + "," + p[2] + "," + a + ")"
			canvas.doColorChange [p[0], p[1], p[2], a]
			return
		
		(document.getElementById 'alphaslider').onchange = (e) !->
			canvas.doColorChange [canvas.action.fillColor[0], canvas.action.fillColor[1], canvas.action.fillColor[2], (parseFloat this.value)]
		
		(document.getElementById 'brightnessslider').onchange = (e) !->
			#console.log this.value
			hslcolor = rgb2hsl canvas.action.fillColor
			#console.log "h,s,l =" + hslcolor[0] + "," + hslcolor[1] + "," + hslcolor[2]
			hslcolor[2] = parseFloat this.value
			rgbcolor = hsl2rgb hslcolor
			canvas.doColorChange [rgbcolor[0], rgbcolor[1], rgbcolor[2], canvas.action.fillColor[3]]
