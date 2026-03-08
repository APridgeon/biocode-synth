import { synth } from "./manual_input/synth";


interface NavItemDropdownProps {
  label: string;
  children: React.ReactNode;
}

function NavItemDropdown({ label, children }: NavItemDropdownProps) {
  return (
    <li className="nav-item dropup">
      <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown" aria-expanded="false">
        {label}
      </a>
      <ul className="dropdown-menu p-3" style={{ minWidth: '200px' }}>
        {children}
      </ul>
    </li>
  );
}

function NavItem({ label, href = "#" }: { label: string; href?: string }) {
  return (
    <li className="nav-item">
      <a className="nav-link" href={href}>{label}</a>
    </li>
  );
}

function InputRange({label}: {label: string}) {
    return (
        <>
            <li>
                <label htmlFor={label} className="form-label">{label}</label>
                <input type="range" className="form-range" id={label} />
            </li>
        </>
    )
}

function NavBarBottom() {

  return (
    <>
      <nav className="navbar fixed-bottom navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">Synth Settings</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarCollapse">
            <ul className="navbar-nav">
              <NavItemDropdown label="Settings">
                {GenerateSynthTypeList(["MonoSynth" , "FMSynth" , "AMSynth" , "Synth" , "DuoSynth" , "MembraneSynth" , "PluckSynth" , "MetalSynth", "NoiseSynth", "PolySynth"])}
                <li><hr className="dropdown-divider"></hr></li>
                <li><a className="dropdown-item" href="#">Something else here</a></li>
              </NavItemDropdown>

              <NavItemDropdown label="Volume">
                <InputRange label="Volume" />
                <InputRange label="Pan" />
              </NavItemDropdown>

              <NavItemDropdown label="Frequency">
                <InputRange label="Frequency" />
              </NavItemDropdown>

              <NavItem label="Status" href="test"/>
            </ul>
          </div>
        </div>
      </nav>
    </>
  )
}

const GenerateSynthTypeList = (synth_types: string[]) => {
  return (
    synth_types.map( synth_type => {
      return(
        <li><a className="dropdown-item" onClick={() => synth.setType(synth_type as any)}>{synth_type}</a></li>
      )
    })
  )
}

export default NavBarBottom
