# CHIP-8

## Introduction

Writing a CHIP-8 emulator following along with [blog](https://tobiasvl.github.io/blog/write-a-chip-8-emulator).

## Specifications

- _Memory_: Has direct access to up to 4 KB of RAM
- _Display_: 64 x 32 pixels (or 128 x 64 for SUPER-CHIP) monochrome, i.e. black and white
- A _Program counter_ or _PC_, which points at the current instruction in memory
- One 16-bit _index register_ called **"I"** which is used to point at locations in memory
- A _stack_ for 16-bit addresses, which is used to call subroutines/functions and return from them
- An 8-bit _delay timer_ which is decremented at a rate of 60 Hz (60 times per second) until it reaches 0
- An 8-bit _sound timer_ which functions like the delay timer, but which also gives off a beeping sound as long as it's not 0
- 16 8-bit (one byte) general-purpose _variable_ registers numbered `0` through `F` hexadecimal, ie. 0 through 15 in decimal, called `V0` through `VF`
  - `VF` is also used as a `flag register`; many instructions will set it to either 1 or 0 based on some rule, for example using it as a carry flag

## TODO

- [ ] add debugging capabilities
  - [x] break on start
  - [x] step
  - [x] print contents of registers - only 16 so can print it all the time
  - [x] print contents of memory - 4096 bytes so need to frame/window the segment
  - [x] print the whole program (raw bytes) - left column address right column instruction
  - [ ] clean code
  - [ ] option to enable and disable debug control
