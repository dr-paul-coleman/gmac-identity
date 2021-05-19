function onLogin(identity) {

}

function onLogout() {
    SFIDWidget.init();
    console.log("Attempted to expire token and init. Redirecting...");
    window.location="https://sfdofy21tso-17932c9b4e8.force.com/secur/logout.jsp?retUrl=https%3A%2F%2Fsfdofy21tso-17932c9b4e8.force.com%2Fidentity%3Fcontext%3Dhttps%253A%252F%252Fgmac-identity.herokuapp.com";
}