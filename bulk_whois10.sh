DOMAINS="alova evona umova urona arova anora cendo bindo pondo rando mundo bilon viron calon tilon nulon divon vario zerio murio fario berio tirio sirio pando vando suveo tiveo nuveo briva cruva drova fliva grova prova trova zyron vyron"
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
