// 3D World - GPU Indexed Vertex Optimization Algorithms
// by Frank Gennari
// 8/17/11

#include "vertex_opt.h"
#include "triListOpt.h"

unsigned const VBUF_SZ   = 32;
bool const DO_VERT_OPT   = 1;
bool const OPT_SORT_ONLY = 1;
bool const OPT_VERBOSE   = 0;


float vert_optimizer::calc_acmr() const {

	vbuf_entry_t vbuf[VBUF_SZ];
	unsigned num_cm(0); // cache misses

	for (unsigned i = 0; i < indices.size(); ++i) {
		bool found(0);
		unsigned best_entry(0), oldest_pos(-1);

		for (unsigned n = 0; n < VBUF_SZ; ++n) {
			if (vbuf[n].ix == indices[i]) {found = 1; break;}
			if (vbuf[n].pos < oldest_pos) {best_entry = n; oldest_pos = vbuf[n].pos;}
		}
		if (found) continue;
		vbuf[best_entry].ix  = indices[i];
		vbuf[best_entry].pos = i;
		++num_cm;
	}
	return float(num_cm)/float(indices.size());
}


void vert_optimizer::run() {

	if (!DO_VERT_OPT || indices.size() < 1.5*num_verts || num_verts < 2*VBUF_SZ /*|| num_verts < 100000*/) return;
	//RESET_TIME;
	float const mult((prim_type == GL_QUADS) ? 2.0 : 3.0);
	float const acmr(mult*calc_acmr()), perfect_acmr(mult*float(num_verts)/float(indices.size()));
	if (acmr < 1.05*perfect_acmr) return;
	//PRINT_TIME("Calc 1");

	if (OPT_SORT_ONLY || prim_type != GL_TRIANGLES) {
		if (prim_type == GL_TRIANGLES) {
			vert_block_t<3>::sort_by_min_ix(indices);
		}
		else {
			assert(prim_type == GL_QUADS);
			vert_block_t<4>::sort_by_min_ix(indices);
		}
	}
	else {
		assert((indices.size() % 3) == 0); // must be triangles
		unsigned const num_tris(indices.size()/3);
		vector<unsigned> out_indices(indices.size());
		TriListOpt::OptimizeTriangleOrdering(num_verts, indices.size(), &indices.front(), &out_indices.front());
		indices.swap(out_indices);
	}
	//PRINT_TIME("Opt");

	if (OPT_VERBOSE) {
		float const new_acmr(mult*calc_acmr());
		//PRINT_TIME("Calc 2");
		cout << "ix: " << indices.size() << ", v: " << num_verts << ", opt: " << perfect_acmr
				<< ", ACMR: " << acmr << " => " << new_acmr << ", ratio: " << new_acmr/acmr << endl;
	}
}


