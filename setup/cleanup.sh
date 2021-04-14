#!/usr/bin/env bash
# shellcheck shell=bash

case "${TRACE_SETUP}" in
    y|Y|yes|YES|t|T|true|TRUE|1)
        set -x
        ;;
esac

set -euo pipefail

unset CD_PATH
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}" || exit 1

# shellcheck source=lib/functions.sh
. lib/functions.sh

# user-overrideable via ENV
if command -v sudo >/dev/null 2>&1; then
    sudo="${sudo:-"sudo"}"
else
    sudo="${sudo}"
fi

export PATH="${SCRIPT_DIR}/../bin:$PATH"


config_backend() {
    sed -n -e 's/^backend: *\(.*\)/\1/p' config.yaml
}

do_footloose() {
    if [ "$(config_backend)" == "ignite" ]; then
        $sudo env "PATH=${PATH}" footloose "${@}"
    else
        footloose "${@}"
    fi
}


# Set up environment from config file
WK_EXECUTABLE="${1:-$(command -v wk)}"
eval "$(${WK_EXECUTABLE} config env "${SCRIPT_DIR}/config.yaml")"

TRACK="${TRACK:-"wks-footloose"}"

if [ "${TRACK}" == "wks-footloose" ]; then
    log "Deleting virtual machines"
    cd "${SCRIPT_DIR}"
    do_footloose delete
fi

if [ "${TRACK}" == "eks" ]; then
    REGION="${REGION:-"eu-west-3"}"
    SKIP_PROMPT="${SKIP_PROMPT:-"0"}"

    if [[ "${SKIP_PROMPT}" -ne 1 ]]; then
        read -r -p "You're about to delete the EKS cluster '${CLUSTER_NAME}' in '${REGION}'. Are you sure? [yN] "
        [[ "${REPLY}" =~ ^[Yy]$ ]] || exit 1
    fi

    function aws_elb_exists() {
        REGION="$1"
        DNS_NAME="$2"
        aws elbv2 describe-load-balancers --region "$REGION" | grep "$DNS_NAME"
    }

    log "Deleting flux..."
    eksctl utils write-kubeconfig --cluster "$CLUSTER_NAME" --region "$REGION"
    kubectl delete namespace wkp-flux || log "Failed to delete wkp-flux namespace. Continuing cleanup..."

    log "Looking up wkp-ui-alb-ingress controller hostname"
    DNS_NAME=$(kubectl get ingress --namespace wkp-ui wkp-ui-alb-ingress --output jsonpath="{.status.loadBalancer.ingress[0].hostname}") || log "Failed to lookup DNS_NAME of wkp-ui ingress"
    if [[ -n "${DNS_NAME}" ]]; then
        log "Deleting wkp-ui alb-ingress..."
        kubectl delete ingress --namespace wkp-ui wkp-ui-alb-ingress || log "Failed to delete alb-ingress. Continuing cleanup..."
        echo -n "Waiting for alb $DNS_NAME in $REGION to disappear"
        while true; do
            echo -n "."
            aws_elb_exists "${REGION}" "${DNS_NAME}" || break
            sleep 5
        done
        echo " done."
    else
        log "Skipping ingress deletion as it doesn't appear to exist, may require manual clean up"
    fi

    log "Deleting cluster $CLUSTER_NAME in $REGION..."
    eksctl delete cluster --region "$REGION" --name "$CLUSTER_NAME"
fi


DELETE_REPO_ON_CLEANUP="${DELETE_REPO_ON_CLEANUP:-"no"}"

if [ "${DELETE_REPO_ON_CLEANUP}" == "yes" ]; then
    hub delete -y "${GIT_PROVIDER_ORG}/${CLUSTER_NAME}"
fi
