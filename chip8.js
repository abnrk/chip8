var chip8 = {};
chip8.mem = new Uint8Array(0x1000);
chip8.reg = new Uint8Array(0x10);
chip8.stack = [];
chip8.dt = 0x00;
chip8.st = 0x00;
chip8.pc = 0x200;
chip8.i = 0x00;
chip8.display = new Uint8Array(64*32);
chip8.keypad = new Uint8Array(0xf);
chip8.cycles = 2;
chip8.draw = function() {
	// draw code goes here
}
chip8.step = function(){
	var opcode = (this.mem[this.pc]<<8)+this.mem[this.pc+1];
	var op_type = opcode>>12;
	var op_x = (opcode>>8)&0xf;
	var op_y = (opcode>>4)&0xf;
	var op_n = opcode&0xf;
	var op_nn = opcode&0xff;
	var op_nnn = opcode&0xfff;
	this.pc = (this.pc+2)%0x1000;
	console.log(this.pc,opcode.toString(16).padStart(4,"0"));
	if(this.dt > 0) {
		this.dt = (this.dt-1)&0xff
	}
	if(this.st > 0) {
		this.st = (this.st-1)&0xff
	}
	if(opcode == 0xe0) {
		this.display.fill(0);
	}
	if(opcode == 0xee) {
		this.pc = this.stack.pop();
	}
	if(op_type == 0x1) {
		this.pc = op_nnn;
	}
	if(op_type == 0x2) {
		this.stack.push(this.pc);
		this.pc = op_nnn;
	}
	// other ways of getting x:
	// (pcode>>8)&0xf
	// (opcode&0x0f00)>>8
	// and y:
	// (pcode>>8)&0xf
	// (opcode&0x00f0)>>4
	// and type:
	// 0x35fe>>8>>4
	if(op_type == 0x3 && this.reg[op_x] == (op_nn)) {
		this.pc += 2;
	}
	if(op_type == 0x4 && this.reg[op_x] != (op_nn)) {
		this.pc += 2;
	}
	if(op_type == 0x5 && this.reg[op_x] == this.reg[op_y]) {
		this.pc += 2;
	}
	if(op_type == 0x6) {
		this.reg[op_x] = op_nn;
	}
	if(op_type == 0x7) {
		this.reg[op_x] += op_nn;
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x0) {
		//console.log(opcode.toString(16));
		this.reg[op_x] = this.reg[op_y];
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x1) {
		this.reg[op_x] |= this.reg[op_y];
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x2) {
		this.reg[op_x] &= this.reg[op_y];
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x3) {
		this.reg[op_x] ^= this.reg[op_y];
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x4) {
		var r = this.reg[op_x] + this.reg[op_y];
		this.reg[op_x] = r;
		if(r > 0xff) {
			this.reg[0xf] = 1;
		} else {
			this.reg[0xf] = 0;
		}
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x5) {
		var vx = this.reg[op_x];
		var vy = this.reg[op_y];
		this.reg[op_x] -= this.reg[op_y];
		if(vx >= vy) {
			this.reg[0xf] = 1;
		} else {
			this.reg[0xf] = 0;
		}
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x6) {
		var vx = this.reg[op_x];
		var r = this.reg[op_x] >> 1;
		this.reg[op_x] = r;
		this.reg[0xf] = vx&0x1;
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x7) {
		this.reg[op_x] = this.reg[op_y] - this.reg[op_x];
		if(this.reg[op_y] >= this.reg[op_x]) {
			this.reg[0xf] = 1;
		} else {
			this.reg[0xf] = 0;
		}
	}
	if(op_type == 0x8 && (opcode&0xf) == 0xe) {
		//this.reg[0xf] = this.reg[op_x]&0x1;
		//this.reg[op_x] <<= this.reg[op_y];
		//this.reg[op_x] <<= 1;
		var vx = this.reg[op_x];
		var r = this.reg[op_x] << 1;
		this.reg[op_x] = r;
		this.reg[0xf] = vx>>7;
	}
	if(op_type == 0x9 && this.reg[op_x] != this.reg[op_y]) {
		this.pc += 2;
	}
	if(op_type == 0xa) {
		this.i = op_nnn;
	}
	if(op_type == 0xb) {
		this.pc = this.reg[0] + op_nnn;
	}
	if(op_type == 0xc) {
		this.reg[op_x] = Math.floor(Math.random()*0xff)&(op_nn);
	}
	if(op_type == 0xd) {
		var vx = this.reg[op_x];
		var vy = this.reg[op_y];
		var h = opcode&0xf;
		for(var y=0; y<h; y++) {
			for(var x=0; x<8; x++) {
				var p = (this.mem[this.i+y]>>(7-x))&0x1;
				var dp = this.display[(vy+y)*64+(vx+x)];
				this.display[(vy+y)*64+(vx+x)] ^= p;
				if(p == 1 && dp == 0) {
					this.reg[0xf] = 1;
				}
			}
		}
		this.draw();
	}
	if(op_type == 0xe && (op_nn) == 0x9e && this.keypad[this.reg[op_x]]) {
		this.pc += 2;
	}
	if(op_type == 0xe && (op_nn) == 0xa1 && this.keypad[this.reg[op_x]]) {
		this.pc += 2;
	}
	if(op_type == 0xf && (op_nn) == 0x07) {
		this.reg[op_x] = this.dt;
	}
	if(op_type == 0xf && (op_nn) == 0x0a) {
		// TODO
		// A key press is awaited, and then stored in VX (blocking operation, all instruction halted until next key event, delay and sound timers should continue processing).
		
	}
	if(op_type == 0xf && (op_nn) == 0x15) {
		this.dt = this.reg[op_x];
	}
	if(op_type == 0xf && (op_nn) == 0x18) {
		this.st = this.reg[op_x];
	}
	if(op_type == 0xf && (op_nn) == 0x1e) {
		this.i += this.reg[op_x];
	}
	if(op_type == 0xf && (op_nn) == 0x29) {
		// TODO
		// Sets I to the location of the sprite for the character in VX(only consider the lowest nibble). Characters 0-F (in hexadecimal) are represented by a 4x5 font.
		this.i = 0x050+((this.reg[op_x]&0x1)*5);
	}
	if(op_type == 0xf && (op_nn) == 0x33) {
		// TODO
		// Stores the binary-coded decimal representation of VX, with the hundreds digit in memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.
	}
	if(op_type == 0xf && (op_nn) == 0x55) {
		for(var i=0; i<=(op_x); i++) {
			this.mem[this.i+i] = this.reg[i];
		}
	}
	if(op_type == 0xf && (op_nn) == 0x65) {
		for(var i=0; i<=(op_x); i++) {
			this.reg[i] = this.mem[this.i+i];
		}
	}
	//this.pc = (this.pc+2)%this.mem.length;
}
chip8.doFrame = function() {
	for(var i=0; i<this.cycles; i++) {
		this.step();
	}
}
chip8.loadFont = function(data,adr) {
	for(var i=0; i<data.length; i++) {
		chip8.mem[adr+i] = data[i];
	}
}
chip8.loadRom = function(data) {
	for(var i=0; i<data.length; i++) {
		chip8.mem[0x200+i] = data[i];
	}
}
chip8.loadBase64 = function(b64) {
	this.loadRom(Uint8Array.fromBase64(b64));
}
chip8.loadFont([
0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
0x20, 0x60, 0x20, 0x20, 0x70, // 1
0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
0x90, 0x90, 0xF0, 0x10, 0x10, // 4
0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
0xF0, 0x10, 0x20, 0x40, 0x40, // 7
0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
0xF0, 0x90, 0xF0, 0x90, 0x90, // A
0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
0xF0, 0x80, 0x80, 0x80, 0xF0, // C
0xE0, 0x90, 0x90, 0x90, 0xE0, // D
0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
0xF0, 0x80, 0xF0, 0x80, 0x80  // F
],0x050);