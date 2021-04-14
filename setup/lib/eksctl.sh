#!/usr/bin/env bash
# shellcheck shell=bash

eksctl_cluster_exists() {
    region="$1"
    name="$2"

    cmd="eksctl get cluster --region=${region} --name=${name}"

    eksctl_output=$(${cmd})
    eksctl_status="$?"

    if [[ "${eksctl_status}" -eq 0 ]]; then
        return 0 # cluster exists
    fi

    if [[ "${eksctl_status}" -eq 1 ]] && grep -q "status code: 404" <(echo "$eksctl_output"); then
        return 1 # cluster does not exist
    fi

    log "Command '${cmd}' failed unexpectedly. Exit code: ${eksctl_status}. Output: ${eksctl_output}"
    return 2
}
