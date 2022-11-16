"use strict"

class UserConfig{
    constructor({...params}){
    }
}

class User{
    constructor(userToken){
        this.userToken = userToken
        this.user_data = this.authUser();
        if(!this.user_data){
            throw new Error("User Failed to Authenticate.")
        }
        this.id = this.user_data.id || 1;
        this.name = this.user_data.name || "Durai";
        this.settings = new UserConfig({...this.user_data})
    }
    
    authUser(){       
        return this.userToken
    }

    getProxyClientVerboseSetting(){
        return this.settings.client_verbose || true;
    }
    
    getProxyUnitVerboseSetting(){
        return this.settings.proxy_verbose || true;
    }
    
    getScraperTimeOut(){
        return this.settings.scraper_timeout || 10;
    }
}

module.exports = User;
