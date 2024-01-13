# Devices & Layout

This source code is originally a fork of the [MPU-9250 Arduino Library](https://github.com/stevenvo/mpuarduino) by Steven Vo.

## Requirements

This library depends on TimerOne library. By default, TimerOne is NOT included in the Arduino IDE. Install from Manage Libraries from Arduino IDE.

## MPU-9250 breakout board

The wiring layout is quite simple:

    ```
    VCC --- 3v
    GND --- Ground
    SCL --- A5 (19)
    SDA --- A4 (18)
    ```
