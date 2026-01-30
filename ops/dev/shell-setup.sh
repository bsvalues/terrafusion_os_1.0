# TerraFusion Dev Shell Setup
# Source this file to enable `tf` command:
#   source /path/to/terrafusion_os_1.0/ops/dev/shell-setup.sh
# Or add to ~/.bashrc / ~/.zshrc

# Find the repo root (works from any subdirectory)
_tf_find_root() {
    local dir="$PWD"
    while [ "$dir" != "/" ]; do
        if [ -f "$dir/ops/dev/tf.sh" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

# Main tf command wrapper
tf() {
    local root
    root=$(_tf_find_root 2>/dev/null)
    
    if [ -z "$root" ]; then
        echo "Error: Not in a TerraFusion workspace" >&2
        echo "  Hint: cd to terrafusion_os_1.0 or a subdirectory" >&2
        return 1
    fi
    
    "$root/ops/dev/tf.sh" "$@"
}

# Tab completion
_tf_complete() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    case "$prev" in
        tf)
            COMPREPLY=($(compgen -W "hub up down doctor gate certify clean logs status ai help" -- "$cur"))
            ;;
        hub)
            COMPREPLY=($(compgen -W "menu list run find" -- "$cur"))
            ;;
        ai)
            COMPREPLY=($(compgen -W "up down status logs ingest query" -- "$cur"))
            ;;
        run)
            # Get IDs from registry
            local root
            root=$(_tf_find_root 2>/dev/null)
            if [ -n "$root" ] && [ -f "$root/ops/tooling/registry.yml" ]; then
                local ids
                ids=$(python3 -c "
import yaml
with open('$root/ops/tooling/registry.yml') as f:
    d = yaml.safe_load(f)
for g in d.get('groups', []):
    for it in g.get('items', []):
        print(it['id'])
" 2>/dev/null)
                COMPREPLY=($(compgen -W "$ids" -- "$cur"))
            fi
            ;;
    esac
}

complete -F _tf_complete tf

echo "✓ TerraFusion shell setup loaded"
echo "  Commands: tf hub | tf gate | tf doctor | tf ai status"
