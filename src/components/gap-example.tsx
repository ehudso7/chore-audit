import { exampleGap } from '@/lib/site';

/** A static illustration of the gap report. Clearly labelled as an example. */
export function GapExample() {
  const [partnerA, partnerB] = exampleGap.partners;
  return (
    <figure className="gap">
      <figcaption>
        What a gap report looks like. Illustrative example, not real data.
      </figcaption>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Who does this?</th>
              <th scope="col">{partnerA} says</th>
              <th scope="col">{partnerB} says</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {exampleGap.rows.map((row) => {
              const agree = row.a === row.b;
              return (
                <tr key={row.task}>
                  <th scope="row">{row.task}</th>
                  <td>{row.a}</td>
                  <td>{row.b}</td>
                  <td>
                    <span className={agree ? 'tag tag-agree' : 'tag tag-differ'}>
                      {agree ? 'Agree' : 'Differ'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
