#!/bin/bash
if [ "$#" -eq "0" ]
  then
    echo "Usage: $0 <binary> [libc]"
    exit
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

tmux new-session -d -s "heepy-42" "cd $DIR/visualizer && npm run start"
tmux new-window -t "heepy-42" "python3 $DIR/backend/backend.py $1 $2"
sleep 4
xdg-open http://localhost:3000 2>&1 >/dev/null &
tmux attach-session -t "heepy-42"
