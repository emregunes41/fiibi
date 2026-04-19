DOMAINS="zevel zofra vulma livan mevza novva luvon fuvan wovin navoz kovel zunel zaven vemar wenza vundo ruvin zelvo rovin mevan revza vantu zinva wulma faven movel wilan zuven muzen favon luvez zovlu vevan novul navel muven zelma valen zinvo nuvan puvan ruvan suvan mivan bivan divan fivan givan yivan"
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
