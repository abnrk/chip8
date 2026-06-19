var chip8 = {};
chip8.mem = new Uint8Array(0x1000);
chip8.reg = new Uint8Array(0xf);
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
		this.pc = opcode&0xfff;
	}
	if(op_type == 0x2) {
		this.stack.push(this.pc);
		this.pc = opcode&0xfff;
	}
	// other ways of getting x:
	// (opcode>>8)&0xf
	// (opcode&0x0f00)>>8
	// and y:
	// (opcode>>8)&0xf
	// (opcode&0x00f0)>>4
	// and type:
	// 0x35fe>>8>>4
	if(op_type == 0x3 && this.reg[(opcode>>8)&0xf] == (opcode&0xff)) {
		this.pc += 2;
	}
	if(op_type == 0x4 && this.reg[(opcode>>8)&0xf] != (opcode&0xff)) {
		this.pc += 2;
	}
	if(op_type == 0x5 && this.reg[(opcode>>8)&0xf] == this.reg[(opcode>>4)&0xf]) {
		this.pc += 2;
	}
	if(op_type == 0x6) {
		this.reg[(opcode>>8)&0xf] = opcode&0xff;
	}
	if(op_type == 0x7) {
		this.reg[(opcode>>8)&0xf] += opcode&0xff;
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x0) {
		//console.log(opcode.toString(16));
		this.reg[(opcode>>8)&0xf] = this.reg[(opcode>>4)&0xf];
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x1) {
		//console.log(opcode.toString(16).padStart(4,"0"),opcode);
		this.reg[(opcode>>8)&0xf] |= this.reg[(opcode>>4)&0xf];
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x2) {
		this.reg[(opcode>>8)&0xf] &= this.reg[(opcode>>4)&0xf];
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x3) {
		this.reg[(opcode>>8)&0xf] ^= this.reg[(opcode>>4)&0xf];
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x4) {
		this.reg[(opcode>>8)&0xf] += this.reg[(opcode>>4)&0xf];
		if((this.reg[(opcode>>8)&0xf])+(this.reg[(opcode>>4)&0xf]) > 0xff) {
			this.reg[0xf] = 1;
		} else {
			this.reg[0xf] = 0;
		}
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x5) {
		this.reg[(opcode>>8)&0xf] -= this.reg[(opcode>>4)&0xf];
		if(this.reg[(opcode>>8)&0xf] >= this.reg[(opcode>>4)&0xf]) {
			this.reg[0xf] = 1;
		} else {
			this.reg[0xf] = 0;
		}
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x6) {
		this.reg[0xf] = this.reg[(opcode>>8)&0xf]&0x1;
		//this.reg[(opcode>>8)&0xf] >>= this.reg[(opcode>>4)&0xf];
		this.reg[(opcode>>8)&0xf] >>= 1;
	}
	if(op_type == 0x8 && (opcode&0xf) == 0x7) {
		this.reg[(opcode>>8)&0xf] = this.reg[(opcode>>4)&0xf] - this.reg[(opcode>>8)&0xf];
		if(this.reg[(opcode>>4)&0xf] >= this.reg[(opcode>>8)&0xf]) {
			this.reg[0xf] = 1;
		} else {
			this.reg[0xf] = 0;
		}
	}
	if(op_type == 0x8 && (opcode&0xf) == 0xe) {
		this.reg[0xf] = this.reg[(opcode>>8)&0xf]&0x1;
		//this.reg[(opcode>>8)&0xf] <<= this.reg[(opcode>>4)&0xf];
		this.reg[(opcode>>8)&0xf] <<= 1;
	}
	if(op_type == 0x9 && this.reg[(opcode>>8)&0xf] != this.reg[(opcode>>4)&0xf]) {
		this.pc += 2;
	}
	if(op_type == 0xa) {
		this.i = opcode&0xfff;
	}
	if(op_type == 0xb) {
		this.pc = this.reg[0] + opcode&0xfff;
	}
	if(op_type == 0xc) {
		this.reg[(opcode>>8)&0xf] = Math.floor(Math.random()*0xff)&(opcode&0xff);
	}
	if(op_type == 0xd) {
		var vx = this.reg[(opcode>>8)&0xf];
		var vy = this.reg[(opcode>>4)&0xf];
		var h = opcode&0xf;
		//console.log(vx,vy);
		for(var y=0; y<h; y++) {
			for(var x=0; x<8; x++) {
				var p = this.display[(vy+y)*64+(vx+x)];
				this.display[(vy+y)*64+(vx+x)] ^= (this.mem[this.i+y]>>(7-x))&0x1;
				if(this.display[(vy+y)*64+(vx+x)] == 0 && p == 1) {
					this.reg[0xf] = 1;
				} else {
					this.reg[0xf] = 0;
				}
			}
		}
		this.draw();
	}
	if(op_type == 0xe && (opcode&0xff) == 0x9e && this.keypad[this.reg[(opcode>>8)&0xf]]) {
		this.pc += 2;
	}
	if(op_type == 0xe && (opcode&0xff) == 0xa1 && this.keypad[this.reg[(opcode>>8)&0xf]]) {
		this.pc += 2;
	}
	if(op_type == 0xf && (opcode&0xff) == 0x07) {
		this.reg[(opcode>>8)&0xf] = this.dt;
	}
	if(op_type == 0xf && (opcode&0xff) == 0x0a) {
		// TODO
		// A key press is awaited, and then stored in VX (blocking operation, all instruction halted until next key event, delay and sound timers should continue processing).
		
	}
	if(op_type == 0xf && (opcode&0xff) == 0x15) {
		this.dt = this.reg[(opcode>>8)&0xf];
	}
	if(op_type == 0xf && (opcode&0xff) == 0x18) {
		this.st = this.reg[(opcode>>8)&0xf];
	}
	if(op_type == 0xf && (opcode&0xff) == 0x1e) {
		this.i += this.reg[(opcode>>8)&0xf];
	}
	if(op_type == 0xf && (opcode&0xff) == 0x29) {
		// TODO
		// Sets I to the location of the sprite for the character in VX(only consider the lowest nibble). Characters 0-F (in hexadecimal) are represented by a 4x5 font.
		this.i = 0x050+((this.reg[(opcode>>8)&0xf]&0x1)*5);
	}
	if(op_type == 0xf && (opcode&0xff) == 0x33) {
		// TODO
		// Stores the binary-coded decimal representation of VX, with the hundreds digit in memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.
	}
	if(op_type == 0xf && (opcode&0xff) == 0x55) {
		for(var i=0; i<=((opcode>>8)&0xf); i++) {
			this.mem[this.i+i] = this.reg[i];
		}
	}
	if(op_type == 0xf && (opcode&0xff) == 0x65) {
		for(var i=0; i<=((opcode>>8)&0xf); i++) {
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