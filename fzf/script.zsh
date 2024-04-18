eval "$(fzf --zsh)"
export FZF_DEFAULT_OPTS='--layout=reverse --border --select-1'

# git sw
function fzf-git-switch() {
    local branch=$(git branch -vv | fzf --height 100% --preview "echo {} | sed -E 's/^[\* ]* ([^ ]*).*/\1/' | xargs git show --color=always --oneline --name-only ")
    git switch $(echo $branch | awk '{print $1}')
}

# git ss
function git-stash-save() {
    if [ $# != 1 ]; then
        echo 引数エラー: $*
        return -1
    fi
    local branch=$(git branch --show-current)
    local date=$(date '+%Y/%m/%d %H:%M:%S')
    git stash save -u "$branch: $1 ($date)"
}

# git sp
function fzf-git-stash-pop() {
    local stash=$(git stash list | fzf --preview "echo {} | sed -E 's/^(stash@{.+}).*/\1/' | xargs git stash show --include-untracked ")
    git stash pop $(echo $stash | awk -F '[:]' '{print $1}')
}

function fzf-z-jump() {
    # 引数があればz, fzfのクエリとして渡す
    local res=$(z -l $1 | cut -c 12- | awk '!a[$0]++{print}' | fzf --query=$1)
    if [ -n "$res" ]; then
        # pushdに積む
        pushd $res
    fi
}

# ctrl+r -> 履歴見れる
