# Sketcharama
**First things first:**  
This is an old project and please keep in mind the source code is not the best and should be optimized. Feel free to optimize and recreate.
## What is it?
Sketcharama is a multiplayer online game, where you draw a word and other users or
your friends will guess your drawn picture.  
Sketcharama was a long time live running and closed source.  
Have a look:  
![gif which shows the function][show_function.gif]
## How do I use it?
Point your webserver to the root folder and activate PHP.
Go into en/server, install and start the server via  
`npm i`  
`node index.js`  
## Docker installation
cd into project <br>
`sudo docker build -t sketcharama .`   <br>
`sudo docker run -p 80:80 -p8001:8001 sketcharama` <br>
Now you are able to play at http://127.0.0.1/en/lobby.php

**IMPORTANT: Please disallow by webserver config to view the index.js of the server.**
## FAQ
### Why are GoogleFonts included in this project
This was an action for the dsgvo (german version of gdpr).
### Is it possible to add more languages
Sure, just create the locales therefore. If you want your frontend in a another language too, then duplicate the folder en and edit the php files to get it work OR you do a big PR and implement full I18n :D
## Other projects used in here
* FontAwesome
* jQuery
* socket.io
* node-express
* sweetAlert (older version)
* spectrum
* GoogleFonts

## License
GPL v3
