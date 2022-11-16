MAC
===
brew uninstall --ignore-dependencies node
brew uninstall --force node
brew update
brew install nvm
mkdir ~/.nvm
vi ~/.zshrc
    export NVM_DIR=~/.nvm
    source $(brew --prefix nvm)/nvm.sh
source ~/.zshrc

nvm ls-remote
nvm install v18.12.1 (LTS) or nvm install --lts
nvm use v18.12.1