# Mars Rover Web Server

## Setup

Use `raspi-config` to enable the camera and SPI

Assumes the path is /home/pi/marsrover/  
Change path in `marsServer.py` if not.

Add the following to /etc/rc.local

(python3 /home/pi/marsrover/marsServer.py > /dev/null 2>&1) &  
(python3 /home/pi/marsrover/battMon.py > /dev/null 2>&1) &

## REST Commands

/voltage/  
/forward/\<seconds>  
/backward/\<seconds>  
/right/\<seconds>  
/left/\<seconds>  

## JQuery

To allow this to work without an internet connection download jquery.min.js and put it in the directory with index.html.

## Background image

Download a background image, name it MarsBackground.png and put it in the directory with index.html.

## Battery monitor

You will need an AnalogZero board and a potential divider (Vin is the main battery. i.e. 12v).  The code uses input A1.

Vin--10k--A1--3.3k--GND    

Connect a buzzer to GPIO13
