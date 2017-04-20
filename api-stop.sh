#!/bin/bash

kill $(cat /tmp/api.pid)
rm /tmp/api.pid
