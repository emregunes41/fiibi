DOMAINS="zefy rofy mofy vufy nufy tofy bofy lufy pufy mefy defy sefy refy venfy zenfy renfy sanfy runfy lanfy menfy panfy tonfy lonfy benfy kanfy hunfy munfy ronfy fliva sliva cliva pliva kliva friva fleva fluva flova flira"
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
