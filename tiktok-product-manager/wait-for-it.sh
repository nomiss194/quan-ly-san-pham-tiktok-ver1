#!/bin/sh
# wait-for-it.sh: wait for a host and port to become available

# Usage: wait-for-it.sh host:port [-s] [-t timeout] [-- command args...]
#    -h HOST | --host=HOST       Host or IP under test
#    -p PORT | --port=PORT       TCP port under test
#                                Alternatively, you specify the host and port as host:port
#    -s | --strict               Only execute subcommand if the test succeeds
#    -q | --quiet                Don't output any status messages
#    -t TIMEOUT | --timeout=TIMEOUT
#                                Timeout in seconds, zero for no timeout
#    -- COMMAND ARGS             Execute command with args after the test finishes

# Author: Giles Hall (https://github.com/vishnubob)
# License: MIT

WAITFORIT_cmdname=${0##*/}

echoerr() { if [ "${WAITFORIT_QUIET:-0}" -ne 1 ]; then echo "$@" 1>&2; fi }

usage()
{
    cat << USAGE >&2
Usage:
    $WAITFORIT_cmdname host:port [-s] [-t timeout] [-- command args...]
    -h HOST | --host=HOST       Host or IP under test
    -p PORT | --port=PORT       TCP port under test
                                Alternatively, you specify the host and port as host:port
    -s | --strict               Only execute subcommand if the test succeeds
    -q | --quiet                Don't output any status messages
    -t TIMEOUT | --timeout=TIMEOUT
                                Timeout in seconds, zero for no timeout
    -- COMMAND ARGS             Execute command with args after the test finishes
USAGE
    exit 1
}

wait_for()
{
    # Check if timeout is available AND executable
    if command -v timeout > /dev/null; then
        TIMEOUT_CMD="timeout"
    # Check if busybox timeout is available AND executable
    elif command -v busybox > /dev/null && busybox --list | grep -q timeout; then
        TIMEOUT_CMD="busybox timeout"
    else
        TIMEOUT_CMD=""
        if [ "${WAITFORIT_TIMEOUT:-0}" -gt 0 ]; then
            echoerr "$WAITFORIT_cmdname: timeout command not found, ignoring timeout"
            WAITFORIT_TIMEOUT=0
        fi
    fi

    if [ "${WAITFORIT_TIMEOUT:-0}" -gt 0 ]; then
        echoerr "$WAITFORIT_cmdname: waiting $WAITFORIT_TIMEOUT seconds for $WAITFORIT_HOST:$WAITFORIT_PORT"
    else
        echoerr "$WAITFORIT_cmdname: waiting for $WAITFORIT_HOST:$WAITFORIT_PORT without timeout"
    fi
    WAITFORIT_start_ts=$(date +%s)
    while :
    do
        # Check with nc if available
        if command -v nc > /dev/null; then
            nc -z "$WAITFORIT_HOST" "$WAITFORIT_PORT"
            WAITFORIT_result=$?
        # Check with /dev/tcp if available (bash/zsh)
        elif head /dev/tcp/"$WAITFORIT_HOST"/"$WAITFORIT_PORT" > /dev/null 2>&1; then
             WAITFORIT_result=0
        # Fallback: Try to use busybox nc if available
        elif command -v busybox > /dev/null && busybox --list | grep -q nc; then
             busybox nc -z -w 1 "$WAITFORIT_HOST" "$WAITFORIT_PORT"
             WAITFORIT_result=$?
        else
            echoerr "$WAITFORIT_cmdname: error: no suitable tool (nc, /dev/tcp, busybox nc) found to check host/port"
            return 1
        fi

        if [ $WAITFORIT_result -eq 0 ]; then
            WAITFORIT_end_ts=$(date +%s)
            echoerr "$WAITFORIT_cmdname: $WAITFORIT_HOST:$WAITFORIT_PORT is available after $((WAITFORIT_end_ts - WAITFORIT_start_ts)) seconds"
            break
        fi

        if [ "${WAITFORIT_TIMEOUT:-0}" -gt 0 ]; then
            WAITFORIT_now_ts=$(date +%s)
            if [ $((WAITFORIT_now_ts - WAITFORIT_start_ts)) -ge "$WAITFORIT_TIMEOUT" ]; then
                echoerr "$WAITFORIT_cmdname: timeout occurred after waiting $WAITFORIT_TIMEOUT seconds for $WAITFORIT_HOST:$WAITFORIT_PORT"
                return 1
            fi
        fi
        sleep 1
    done
    return 0
}

wait_for_wrapper()
{
    # In order to support SIGINT during timeout: http://unix.stackexchange.com/a/57692
    if [ "${WAITFORIT_QUIET:-0}" -eq 1 ]; then
        $TIMEOUT_CMD "$WAITFORIT_TIMEOUT" "$0" --quiet --child --host="$WAITFORIT_HOST" --port="$WAITFORIT_PORT" --timeout="$WAITFORIT_TIMEOUT" &
    else
        $TIMEOUT_CMD "$WAITFORIT_TIMEOUT" "$0" --child --host="$WAITFORIT_HOST" --port="$WAITFORIT_PORT" --timeout="$WAITFORIT_TIMEOUT" &
    fi
    WAITFORIT_PID=$!
    trap "kill -INT -$WAITFORIT_PID" INT
    wait $WAITFORIT_PID
    WAITFORIT_result=$?
    # Restore default INT handler
    trap - INT
    if [ $WAITFORIT_result -ne 0 ]; then
        # Timeout exits with 124, but other errors might occur
        echoerr "$WAITFORIT_cmdname: timeout occurred after waiting $WAITFORIT_TIMEOUT seconds for $WAITFORIT_HOST:$WAITFORIT_PORT"
    fi
    return $WAITFORIT_result
}

# process arguments
while [ $# -gt 0 ]
do
    case "$1" in
        *:* )
        WAITFORIT_HOST=$(printf "%s\n" "$1"| cut -d : -f 1)
        WAITFORIT_PORT=$(printf "%s\n" "$1"| cut -d : -f 2)
        shift 1
        ;;
        --child)
        WAITFORIT_CHILD=1
        shift 1
        ;;
        -q | --quiet)
        WAITFORIT_QUIET=1
        shift 1
        ;;
        -s | --strict)
        WAITFORIT_STRICT=1
        shift 1
        ;;
        -h)
        WAITFORIT_HOST="$2"
        if [ "$WAITFORIT_HOST" = "" ]; then break; fi
        shift 2
        ;;
        --host=*)
        WAITFORIT_HOST="${1#*=}"
        shift 1
        ;;
        -p)
        WAITFORIT_PORT="$2"
        if [ "$WAITFORIT_PORT" = "" ]; then break; fi
        shift 2
        ;;
        --port=*)
        WAITFORIT_PORT="${1#*=}"
        shift 1
        ;;
        -t)
        WAITFORIT_TIMEOUT="$2"
        if [ "$WAITFORIT_TIMEOUT" = "" ]; then break; fi
        shift 2
        ;;
        --timeout=*)
        WAITFORIT_TIMEOUT="${1#*=}"
        shift 1
        ;;
        --)
        shift
        WAITFORIT_CLI="$@"
        break
        ;;
        --help)
        usage
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done

if [ -z "$WAITFORIT_HOST" ] || [ -z "$WAITFORIT_PORT" ]; then
    echoerr "Error: you need to provide a host and port to test."
    usage
fi

WAITFORIT_TIMEOUT=${WAITFORIT_TIMEOUT:-15}
WAITFORIT_STRICT=${WAITFORIT_STRICT:-0}
WAITFORIT_CHILD=${WAITFORIT_CHILD:-0}
WAITFORIT_QUIET=${WAITFORIT_QUIET:-0}

# Check if timeout is available AND executable
if ! command -v timeout > /dev/null; then
    # Check if busybox timeout is available AND executable
    if ! command -v busybox > /dev/null || ! busybox --list | grep -q timeout; then
        if [ "${WAITFORIT_TIMEOUT:-0}" -gt 0 ]; then
             echoerr "Error: timeout command not found, ignoring timeout"
             WAITFORIT_TIMEOUT=0
        fi
    fi
fi

if [ $WAITFORIT_CHILD -gt 0 ]; then
    wait_for
    WAITFORIT_result=$?
    exit $WAITFORIT_result
else
    if [ "${WAITFORIT_TIMEOUT:-0}" -gt 0 ]; then
        wait_for_wrapper
        WAITFORIT_result=$?
    else
        wait_for
        WAITFORIT_result=$?
    fi
fi

if [ -n "$WAITFORIT_CLI" ] ; then
    if [ $WAITFORIT_result -ne 0 ] && [ $WAITFORIT_STRICT -eq 1 ]; then
        echoerr "$WAITFORIT_cmdname: strict mode, refusing to execute subprocess"
        exit $WAITFORIT_result
    fi
    exec $WAITFORIT_CLI
else
    exit $WAITFORIT_result
fi