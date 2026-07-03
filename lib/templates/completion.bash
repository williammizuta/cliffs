#!/usr/bin/env bash

__CLI_FN___completions() {
    local cur prev words cword
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    # Build the command path based on all words before the cursor position
    # This allows completion to work when cursor is in the middle
    local cmd_path=""
    local i
    for ((i=1; i<COMP_CWORD; i++)); do
        # Skip flags/options and empty strings
        if [[ -n "${COMP_WORDS[i]}" && "${COMP_WORDS[i]}" != -* ]]; then
            cmd_path="$cmd_path ${COMP_WORDS[i]}"
        fi
    done

    # Try to get completions from the __CLI_NAME__ command
    local completions
    local cmd_output
    if [[ -z "$cmd_path" ]]; then
        # Root level completion
        cmd_output=$(__CLI_NAME__ 2>/dev/null)
    else
        # Nested command completion
        # shellcheck disable=SC2086
        cmd_output=$(__CLI_NAME__ $cmd_path 2>/dev/null)
    fi

    # Check if this is a help output (contains "Usage:") or a command list
    if echo "$cmd_output" | grep -q "^Usage:"; then
        # This is a terminal command that expects arguments/options
        # Don't provide any completions for positional arguments
        # User should type the argument value or use -- for options
        completions=""
    else
        # This is a command list, extract the commands
        completions=$(echo "$cmd_output" | tail -n +2 | sed 's:^ - ::' | grep -v "^$" | tr '\n' ' ')
    fi

    # If the current word starts with -, try to get options from help
    if [[ "$cur" == -* ]]; then
        # For options, we need the full command path up to the last non-option word
        # even if there are more words after the cursor
        local full_cmd_path=""
        for ((i=1; i<${#COMP_WORDS[@]}; i++)); do
            # Skip the current position and options
            if [[ $i -ne $COMP_CWORD && -n "${COMP_WORDS[i]}" && "${COMP_WORDS[i]}" != -* ]]; then
                full_cmd_path="$full_cmd_path ${COMP_WORDS[i]}"
            fi
        done

        # Try to get the command help to extract options
        local help_output
        if [[ -z "$full_cmd_path" ]]; then
            help_output=$(__CLI_NAME__ --help 2>/dev/null || true)
        else
            help_output=$(__CLI_NAME__ $full_cmd_path --help 2>/dev/null || true)
        fi

        # Extract options from docopt-style help
        # Look for options in the Options: section or lines starting with --
        if [[ -n "$help_output" ]]; then
            local options
            # Extract only option flags, not their descriptions
            # Look for patterns like --option or -o at the beginning of lines or after spaces
            options=$(echo "$help_output" | grep -E '^\s*(--[a-zA-Z0-9\-]+|-[a-zA-Z])' | grep -oE '\-\-[a-zA-Z0-9\-]+|\-[a-zA-Z]\b' | sort -u | tr '\n' ' ')

            # If no options found with the above method, try a more conservative approach
            if [[ -z "$options" ]]; then
                # Only get options that appear in Options: section
                options=$(echo "$help_output" | sed -n '/^Options:/,/^[A-Z]/p' | grep -oE '\-\-[a-zA-Z0-9\-]+' | sort -u | tr '\n' ' ')
            fi

            if [[ -n "$options" ]]; then
                COMPREPLY=($(compgen -W "$options" -- "$cur"))
                return
            fi
        fi
    fi

    # Filter completions based on current word
    COMPREPLY=($(compgen -W "$completions" -- "$cur"))
}

# Register __CLI_FN___completions as the completion function for "__CLI_NAME__" command
complete -F __CLI_FN___completions __CLI_NAME__
