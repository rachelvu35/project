Working with the Project
Download this project from above link. Create two configaration files into the project. First in the client and second in the server.

In the Client Folder create .env file and put this code inside it.

.env
REACT_APP_SERVER_DOMAIN='<server_domain>' # example 'http://localhost:8080'
After that create a file in the Server Folder with the name config.js and put the below code inside it.

config.js

export default {
    JWT_SECRET : "<secret>",
    EMAIL: "steve.franecki@ethereal.email", // testing email & password
    PASSWORD : "sMf46xCzrvdrxvuagc",
    MONGO_URI: "<MONGODB_URI>"
}
