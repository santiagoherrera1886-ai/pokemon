#!/bin/bash
# Arma los tres escenarios en Blender (uno tras otro) y los comprime con meshopt.
cd "$(dirname "$0")"
for s in "$@"; do
  start=$(date +%s)
  ${PYTHON:-python3} $s.py > $s.log 2>&1; code=$?
  (cd out && gltf-transform weld $s.glb $s-w.glb > /dev/null 2>&1 && gltf-transform meshopt $s-w.glb $s-m.glb > /dev/null 2>&1)
  echo "$s exit=$code $(( $(date +%s) - start ))s $(ls -la out/$s-m.glb | awk '{print $5}')" >> build_all.log
done
echo DONE >> build_all.log
