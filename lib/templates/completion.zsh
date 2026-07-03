__CLI_FN__() {
  local cmd_path="" i

  for ((i=2; i<CURRENT; i++)); do
    if [[ -n "${words[i]}" && "${words[i]}" != -* ]]; then
      cmd_path+=" ${words[i]}"
    fi
  done
  cmd_path="${cmd_path# }"

  local help_output
  if [[ -z "$cmd_path" ]]; then
    help_output=$(__CLI_NAME__ --help 2>/dev/null)
  else
    help_output=$(__CLI_NAME__ ${=cmd_path} --help 2>/dev/null)
  fi

  if grep -q "^Usage:" <<< "$help_output"; then
    local -a options
    options=(${(f)"$(grep -E '^\s*(--[a-zA-Z0-9-]+|-[a-zA-Z])' <<< "$help_output" | grep -oE -- '--[a-zA-Z0-9-]+|-[a-zA-Z]\b' | sort -u)"})
    compadd -a options
    return
  fi

  local -a completions
  completions=(${(f)"$(tail -n +2 <<< "$help_output" | sed 's:^ - ::' | grep -v '^$')"})
  compadd -a completions
}

compdef __CLI_FN__ __CLI_NAME__
