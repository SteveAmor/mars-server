import io
import picamera
import logging
import socketserver
from threading import Condition
from http import server
from gpiozero import Motor, MCP3008
from time import sleep

PATH = '/home/pi/marsrover/'

rightMotor = Motor(16,19)
leftMotor = Motor(20,21)

adc = MCP3008(channel=1)

Vref = 3.3
potentialDividerMultiplier = 4.03 # Vin--10k--+--3.3k--GND
                                  #           |
                                  #           A1

class StreamingOutput(object):
    def __init__(self):
        self.frame = None
        self.buffer = io.BytesIO()
        self.condition = Condition()

    def write(self, buf):
        if buf.startswith(b'\xff\xd8'):
            # New frame, copy the existing buffer's content and notify all
            # clients it's available
            self.buffer.truncate()
            with self.condition:
                self.frame = self.buffer.getvalue()
                self.condition.notify_all()
            self.buffer.seek(0)
        return self.buffer.write(buf)

class StreamingHandler(server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(301)
            self.send_header('Location', '/index.html')
            self.end_headers()
        elif self.path == '/index.html':
            f = open(PATH+'index.html', 'rb')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(f.read())
            f.close()
        elif self.path == '/stream.mjpg':
            self.send_response(200)
            self.send_header('Age', 0)
            self.send_header('Cache-Control', 'no-cache, private')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
            self.end_headers()
            try:
                while True:
                    with output.condition:
                        output.condition.wait()
                        frame = output.frame
                    self.wfile.write(b'--FRAME\r\n')
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', len(frame))
                    self.end_headers()
                    self.wfile.write(frame)
                    self.wfile.write(b'\r\n')
            except Exception as e:
                logging.warning(
                    'Removed streaming client %s: %s',
                    self.client_address, str(e))
        elif self.path == '/MarsBackground.png':
            f = open(PATH+'MarsBackground.png', 'rb')
            self.send_response(200)
            self.send_header('Content-Type', 'image/png')
            self.end_headers()
            self.wfile.write(f.read())
            f.close()
        elif self.path == '/jquery.min.js':
            f = open(PATH+'jquery.min.js', 'rb')
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.end_headers()
            self.wfile.write(f.read())
            f.close()
        elif self.path == '/static.gif':
            f = open(PATH+'static.gif', 'rb')
            self.send_response(200)
            self.send_header('Content-Type', 'image/gif')
            self.end_headers()
            self.wfile.write(f.read())
            f.close()
        elif self.path == '/voltage' or self.path == '/voltage/':
            self.voltage = adc.value * Vref * potentialDividerMultiplier
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.voltagestr = "[{ \"value\": \"" + "{:0.3f}".format(self.voltage) + "\" }]"
            self.wfile.write(self.voltagestr.encode('utf-8'))
        elif self.path.split("/")[1] == 'forward':
            try:
                delay = (int(self.path.split("/")[2]))
            except:
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write("error".encode('utf-8'))
                return
            leftMotor.forward(speed=0.5)
            rightMotor.forward(speed=0.5)
            sleep(delay)
            leftMotor.stop()
            rightMotor.stop()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write("ok".encode('utf-8'))
        elif self.path.split("/")[1] == 'backward':
            try:
                delay = (int(self.path.split("/")[2]))
            except:
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write("error".encode('utf-8'))
                return
            leftMotor.backward(speed=0.5)
            rightMotor.backward(speed=0.5)
            sleep(delay)
            leftMotor.stop()
            rightMotor.stop()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write("ok".encode('utf-8'))
        elif self.path.split("/")[1] == 'right':
            try:
                delay = (int(self.path.split("/")[2]))
            except:
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write("error".encode('utf-8'))
                return
            leftMotor.forward(speed=0.5)
            rightMotor.backward(speed=0.5)
            sleep(delay)
            leftMotor.stop()
            rightMotor.stop()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write("ok".encode('utf-8'))
        elif self.path.split("/")[1] == 'left':
            try:
                delay = (int(self.path.split("/")[2]))
            except:
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write("error".encode('utf-8'))
                return
            leftMotor.backward(speed=0.5)
            rightMotor.forward(speed=0.5)
            sleep(delay)
            leftMotor.stop()
            rightMotor.stop()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write("ok".encode('utf-8'))
        else:
            self.send_error(404)
            self.end_headers()

class StreamingServer(socketserver.ThreadingMixIn, server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

with picamera.PiCamera(resolution='640x480', framerate=10) as camera:
    output = StreamingOutput()
    camera.vflip = True
    camera.hflip = True
    camera.start_recording(output, format='mjpeg')
    try:
        address = ('', 80)
        server = StreamingServer(address, StreamingHandler)
        server.serve_forever()
    finally:
        camera.stop_recording()
