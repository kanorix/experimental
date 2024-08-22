eval "$(fzf --zsh)"
export FZF_DEFAULT_OPTS='--layout=reverse --border --select-1'

# git sw
function fzf-git-switch() {
    if [ $(git branch -vv | wc -l) -eq 1 ]; then
        # ブランチが1つだけなので何もしない
        return 0
    fi
    local branch=$(git branch -vv | fzf --height 100% --preview "echo {} | sed -E 's/^[\* ]* ([^ ]*).*/\1/' | xargs git show --color=always --oneline --name-only ")
    git switch $(echo $branch | awk '{print $1}')
}

# git ss
function git-stash-push() {
    local date=$(date '+%Y/%m/%d %H:%M:%S')
    git stash push -u -m "[$date]: ${1:-saved}"
}

# git sp
function fzf-git-stash-pop() {
    local target_stash=$(git stash list | fzf --query=$1 --preview "echo {} | sed -E 's/^(stash@{.+}).*/\1/' | xargs git stash show --include-untracked --stat --color=always")
    local stash_name=$(echo $target_stash | awk -F '[:]' '{print $1}')
    if [ -z "$stash_name" ]; then
        # キャンセル
        return 0
    fi

    echo $(git rev-parse $stash_name)
    # git stash pop --index $stash_name
    git stash apply --index $stash_name
}

# git save
function git-savepoint() {
    git-stash-push
    fzf-git-stash-pop stash@{0}
}

# ctrl+r -> 履歴見れる

function fd() {
    find ${1:-`pwd`} -path '*/\.*' -prune -o -type d -print 2> /dev/null
}

function j() {
    local targets=$(z -l $1 | cut -c 12-)

    # git管理下の場合、gitルートにある隠しディレクトリ以外のディレクトリを検索に含める
    local git_root=$(git rev-parse -q --show-toplevel 2> /dev/null)
    if [ -n "$git_root" ]; then
        targets="${targets}\n$(fd $git_root)"
    fi

    # 重複を省く、ホームディレクトリ下のファイルは「~/...」で表して表示する
    targets=$(echo $targets | awk '!a[$0]++{print}' | grep -v "^$PWD$")

    # ホームディレクトリ直下以外では、実行した場所以下のものは「@/...」で表示する
    if [ $PWD != $HOME ]; then
        targets=$(echo $targets | sed "s|^$PWD|@|")
    fi

    # 絶対パスをホームディレクトリからの相対パスに書き換える
    targets=$(echo $targets | sed "s|^$HOME|~|")

    local path_to_jump=$(echo $targets | fzf --query=$1)
    if [ -n "$path_to_jump" ]; then
        cd $(echo $path_to_jump | sed "s|^@|$PWD|" | sed "s|^~|$HOME|")
    fi
}

function j+() {
    local path_to_jump=$(dirs -v | awk '{print $2}' | fzf)
    if [ -n "$path_to_jump" ]; then
        cd $(echo $path_to_jump | sed "s|^~|$HOME|")
    fi
}

alias j-="popd > /dev/null"
