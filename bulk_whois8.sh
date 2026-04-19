DOMAINS="uzova ozena ixova exova axevo izano ovazo rovan zevel vivox novux xaron wixon ziven vexen nexov fexin noxal zovax kivex duvax wexon lunza ponza rinza xenzo xando vando zofra"
count=0
for d in $DOMAINS; do
  result=$(whois $d.co | grep -i -E "No match for|NOT FOUND")
  if [ ! -z "$result" ]; then
    echo "AVAILABLE: $d.co"
    count=$((count+1))
  fi
  sleep 0.1
done
echo "Total found: $count"
