DOMAINS="zivvo ruvvo nevvo zento voxen zenio paxon fixal zorel xopya mavox novva revva kavva fuvvo zivva nexar vexar loxan zoxar muxal nival zuval xivol woval bival puvol tuvol muvol fuvol ruvol puval luval cuval suval kuvon duvon nivon xivon wuvon zivon"
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
