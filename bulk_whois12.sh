DOMAINS="fiibi piibi niibi viibi riibi biibi kiibo tuuvo miivo jiivo suuvo ziibo voovo vuuvo zuumi ruuvi zeebo leevi teemi veemo noovo fiifo viifo moovo roovo xooxo doovi koovi luudo guudo xoova viiza niiza riizo viiso diizo meevo teevo neevo heevo"
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
