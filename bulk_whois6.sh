DOMAINS="vubix zexan mevzo wuxel zoxen vuxen gexol puxen tuxen fexol huvox revox xevan luvan mevan moxen zovan vexon lexon nivox ruvax tuvax yuvax zevox viron vurax"
count=0
for d in $DOMAINS; do
  result=$(whois $d.co | grep -i -E "No match for|NOT FOUND")
  if [ ! -z "$result" ]; then
    echo "AVAILABLE: $d.co"
    count=$((count+1))
  fi
  if [ $count -ge 15 ]; then
    break
  fi
  sleep 0.1
done
echo "Total found: $count"
